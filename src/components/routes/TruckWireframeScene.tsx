"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Edges,
  Line,
  OrbitControls,
  OrthographicCamera,
} from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import {
  BackSide,
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  LineBasicMaterial,
  MathUtils,
  MeshBasicMaterial,
  type Group,
  type Material,
  type Mesh,
} from "three";
import {
  heightFactorForKind,
  paletteForUnit,
} from "./palletColor";
import type {
  DimensionsCm,
  PalletKind,
  PositionCm,
  Product,
  TruckVisualization,
  VizPallet,
} from "./types";

// =============================================================================
// Constants — all proportions live here to keep the components readable.
// =============================================================================

const CM_TO_SCENE = 0.018;

const SCENE = {
  // Vertical lift between the ground and the underside of the cargo deck.
  // ~125 cm leaves room for ~50 cm wheels (top at 100 cm) plus chassis frame.
  chassisHeightCm: 125,

  // Pallet's wooden base height (the platform under the product stack).
  palletBaseHeightCm: 15,

  // Cabin body dimensions. Used both by the Cabin component and by the
  // horizontal centering offset below.
  cabinLengthCm: 170,
  cabinHeightCm: 200,

  // Gap between cabin back wall and cargo box front wall.
  cabinCargoGapCm: 18,

  // Lateral overhang of the wheels past the cargo body sides. Big enough that
  // a 50-cm-radius tire with thick sidewall doesn't poke into the cargo box.
  wheelOutwardCm: 22,

  // Front axle X position (in truck coords, negative because it's under the cabin).
  truckFrontAxleCm: -95,
  vanFrontAxleCm: -55,

  // Tandem rear axles use ABSOLUTE 145 cm spacing (real Damm rigid lorries) so the
  // two rear wheels never overlap regardless of cargo length.
  truckTandemSpacingCm: 145,
  // Last (rearmost) axle position as a fraction of cargo length, measured from
  // the front of the cargo box.
  truckTandemRearAt: 0.84,
  vanRearAxleAt: 0.78,

  // Trucks below this length use the "van" wheel layout (single rear axle, smaller tires).
  vanLengthThresholdCm: 450,

  // Wheel sizes per layout. Real Damm 6/8-pal trucks run ~22.5" tires (~52 cm radius).
  truckWheelRadiusCm: 50,
  vanWheelRadiusCm: 36,
};


const COLOR = {
  bg: "#050505",
  fog: "#050505",

  cargoEdge: "#e9fbff",
  cargoFill: "#9adfff",
  cargoFillOpacity: 0.025,

  cargoDeck: "#0a121b",
  cargoDeckOpacity: 0.32,

  cargoPillar: "#bfe9ff",

  cabinEdge: "#dff8ff",
  cabinFill: "#ffffff",
  cabinFillOpacity: 0.04,

  windshieldLine: "#78e7ff",

  chassis: "#1f2a37",
  chassisEdge: "#94a3b8",

  rib: "#e9fbff",
  ribOpacity: 0.22,

  rearDoor: "#ff6b9a",
  rearDoorOpacity: 0.6,

  gridPrimary: "#78e7ff",
  gridSecondary: "#1f3742",

  palletBase: "#a98e6a",
  palletBaseEdge: "#cba87b",
  palletBaseOpacity: 0.35,

  tireRubber: "#0a0d10",
  tireEdge: "#3a4048",
  hub: "#1a2028",
  hubAccent: "#5a6068",
  hubCap: "#2a3038",

  headlight: "#f7c948",
};

const CHASSIS_LIFT_SCENE = SCENE.chassisHeightCm * CM_TO_SCENE;

// Horizontal offset that re-centers the truck (cargo box + cabin) at scene
// X = 0 inside the Stage group. Without it the cabin is purely on the -X
// side of the cargo box, so the whole truck visually drifts left and the
// orbit pivot ends up off-centre.
const TRUCK_CENTER_OFFSET_SCENE =
  ((SCENE.cabinLengthCm + SCENE.cabinCargoGapCm) / 2) * CM_TO_SCENE;

// =============================================================================
// Helpers
// =============================================================================

function safe(cm: number, fallback: number) {
  return Number.isFinite(cm) && cm > 0 ? cm : fallback;
}

function toSceneSize(d: DimensionsCm): [number, number, number] {
  return [
    safe(d.length_cm, 1) * CM_TO_SCENE,
    safe(d.height_cm, 1) * CM_TO_SCENE,
    safe(d.width_cm, 1) * CM_TO_SCENE,
  ];
}

function toScenePos(
  p: PositionCm,
  truck: DimensionsCm,
): [number, number, number] {
  return [
    (p.x - safe(truck.length_cm, 1) / 2) * CM_TO_SCENE,
    p.z * CM_TO_SCENE,
    (p.y - safe(truck.width_cm, 1) / 2) * CM_TO_SCENE,
  ];
}

function isVanLayout(truck: DimensionsCm) {
  return safe(truck.length_cm, 1) < SCENE.vanLengthThresholdCm;
}

interface DimensionsProps {
  dimensions: DimensionsCm;
}

// =============================================================================
// Public component
// =============================================================================

interface TruckWireframeSceneProps {
  visualization: TruckVisualization;
  // Pallet currently in focus — drives the dim/highlight in the 3D scene.
  // Resolved by the parent as `selectedId ?? hoveredId` so a sticky
  // selection trumps hover.
  focusedPalletId?: string | null;
  onHoverPallet?: (id: string | null) => void;
  // Click-to-select. Pass null to clear (also fired on background click).
  onSelectPallet?: (id: string | null) => void;
}

export function TruckWireframeScene({
  visualization,
  focusedPalletId = null,
  onHoverPallet,
  onSelectPallet,
}: TruckWireframeSceneProps) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      shadows={false}
      onPointerMissed={() => {
        onHoverPallet?.(null);
        onSelectPallet?.(null);
      }}
    >
      <color attach="background" args={[COLOR.bg]} />
      <fog attach="fog" args={[COLOR.fog, 14, 32]} />
      <hemisphereLight args={["#bce7ff", "#0a0f14", 0.55]} />
      <pointLight position={[5, 8, 4]} intensity={0.8} color="#78e7ff" />
      <pointLight position={[-5, 3, -4]} intensity={0.4} color="#ff6b9a" />

      <IsoCamera dimensions={visualization.truck_dims} />
      <YardFloor />
      <Stage
        visualization={visualization}
        focusedPalletId={focusedPalletId}
        onHoverPallet={onHoverPallet}
        onSelectPallet={onSelectPallet}
      />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minDistance={6}
        maxDistance={22}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.5}
        target={isoOrbitTarget(visualization.truck_dims)}
      />
    </Canvas>
  );
}

// Truck visual center in world space. The cabin TIP (full cabin length plus
// the cabin-cargo gap) extends past the cargo box's front, so framing the
// cargo midpoint alone pushes the cabin off-frame. We frame the midpoint of
// cabin tip and cargo rear, transformed by the truck group's fixed Y rotation.
// Y is the truck's vertical midpoint (wheel bottom ↔ cargo top).
const TRUCK_ROT_Y = -0.42;
// Distance from cargo box front (= local X = 0) to the cabin's front face,
// including the cabin-cargo gap. Used to find the geometric midpoint of the
// truck along its length axis.
const CABIN_TIP_FROM_CARGO_CM = 170 + 18;
const ISO_TARGET_Y = 2.5;

function isoOrbitTarget(truck: DimensionsCm): [number, number, number] {
  const cabinTip = CABIN_TIP_FROM_CARGO_CM * CM_TO_SCENE;
  const cargoHalf = (safe(truck.length_cm, 540) / 2) * CM_TO_SCENE;
  const centerLocalX = (cargoHalf - cabinTip) / 2;
  const cos = Math.cos(TRUCK_ROT_Y);
  const sin = Math.sin(TRUCK_ROT_Y);
  return [centerLocalX * cos, ISO_TARGET_Y, -centerLocalX * sin];
}

// =============================================================================
// Camera — orthographic isometric only.
// =============================================================================

// Orthographic isometric camera. Parallel projection — no foreshortening, like
// Cinema 4D's "Parallel" view. Camera sits on the truck's right side, slightly
// in front of cabin and elevated, so the framing reads as a 3/4 hero shot with
// the cabin on screen-left and the cargo extending to screen-right. The
// orthographic `zoom` controls framing and scales inversely with truck length
// so a van and an 8pal both fit the canvas with similar margins.
//
// `ISO_CAMERA_OFFSET` is camera-position-minus-target — the angle the user
// dialled in via OrbitControls drag. Camera position is computed from the
// (truck-dependent) target + this offset so the same angle holds for every
// truck length. Lower X + Y nudges the camera "down and left" relative to
// the previous lock-in.
const ISO_CAMERA_OFFSET: [number, number, number] = [-12.7, 4.9, 6.98];

function IsoCamera({ dimensions }: DimensionsProps) {
  const { size } = useThree();
  const isNarrow = size.width < 700;
  const lengthFactor = Math.max(0.78, safe(dimensions.length_cm, 540) / 620);
  const baseZoom = isNarrow ? 34 : 49;
  const zoom = baseZoom / lengthFactor;

  const target = isoOrbitTarget(dimensions);
  const position: [number, number, number] = [
    target[0] + ISO_CAMERA_OFFSET[0],
    target[1] + ISO_CAMERA_OFFSET[1],
    target[2] + ISO_CAMERA_OFFSET[2],
  ];

  return (
    <OrthographicCamera
      makeDefault
      position={position}
      zoom={zoom}
      near={-100}
      far={200}
    />
  );
}

// =============================================================================
// Stage — root truck group, applies idle bob + 3/4 view rotation.
// =============================================================================

function Stage({
  visualization,
  focusedPalletId,
  onHoverPallet,
  onSelectPallet,
}: {
  visualization: TruckVisualization;
  focusedPalletId: string | null;
  onHoverPallet?: (id: string | null) => void;
  onSelectPallet?: (id: string | null) => void;
}) {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y =
      -1.25 + Math.sin(clock.elapsedTime * 0.5) * 0.02;
  });

  return (
    <group ref={groupRef} rotation={[0, -0.42, 0]} position={[0, -1.25, 0]}>
      {/* Centering wrapper: shifts the whole truck so its geometric centre
          (cargo box + cabin combined) sits at scene X = 0. The orbit pivot
          then matches the truck's visual centre on every truck length. */}
      <group position={[TRUCK_CENTER_OFFSET_SCENE, 0, 0]}>
        {/* Body sub-group is lifted by chassis height. Wheels stay at ground. */}
        <group position={[0, CHASSIS_LIFT_SCENE, 0]}>
          <Chassis dimensions={visualization.truck_dims} />
          <CargoBox dimensions={visualization.truck_dims} />
          <CargoDeck dimensions={visualization.truck_dims} />
          <CornerPillars dimensions={visualization.truck_dims} />
          <Cabin dimensions={visualization.truck_dims} />
          <Pallets
            pallets={visualization.pallets}
            truck={visualization.truck_dims}
            focusedPalletId={focusedPalletId}
            onHoverPallet={onHoverPallet}
            onSelectPallet={onSelectPallet}
          />
        </group>
        <WheelSet dimensions={visualization.truck_dims} />
      </group>
    </group>
  );
}

// =============================================================================
// Chassis — two longitudinal beams + crossmembers below the cargo deck.
// =============================================================================

function Chassis({ dimensions }: DimensionsProps) {
  const beamThicknessCm = 12;
  const beamHeightCm = 16;
  // Place beams just below the cargo deck (which lives at z = 0 inside the body group).
  const beamCenterZcm = -beamHeightCm / 2 - 4;

  const beamXFront = -SCENE.cabinCargoGapCm - 20;
  const beamXRear = dimensions.length_cm + 5;
  const beamLengthCm = beamXRear - beamXFront;
  const beamCenterXcm = (beamXFront + beamXRear) / 2;

  const innerY = dimensions.width_cm * 0.32;
  const outerY = dimensions.width_cm * 0.68;
  const beamYs = [innerY, outerY];

  const crossLengthCm = outerY - innerY;
  const crossCenterY = dimensions.width_cm * 0.5;
  const crossXs: number[] = [];
  const step = 95;
  for (let x = beamXFront + 60; x <= beamXRear - 30; x += step) {
    crossXs.push(x);
  }

  return (
    <group>
      {beamYs.map((y) => (
        <mesh
          key={`beam-${y}`}
          position={toScenePos(
            { x: beamCenterXcm, y, z: beamCenterZcm },
            dimensions,
          )}
        >
          <boxGeometry
            args={[
              beamLengthCm * CM_TO_SCENE,
              beamHeightCm * CM_TO_SCENE,
              beamThicknessCm * CM_TO_SCENE,
            ]}
          />
          <meshBasicMaterial color={COLOR.chassis} />
          <Edges color={COLOR.chassisEdge} linewidth={0.7} />
        </mesh>
      ))}

      {crossXs.map((x) => (
        <mesh
          key={`cross-${x}`}
          position={toScenePos(
            { x, y: crossCenterY, z: beamCenterZcm },
            dimensions,
          )}
        >
          <boxGeometry
            args={[
              beamThicknessCm * CM_TO_SCENE,
              beamHeightCm * 0.7 * CM_TO_SCENE,
              crossLengthCm * CM_TO_SCENE,
            ]}
          />
          <meshBasicMaterial color={COLOR.chassis} />
          <Edges color={COLOR.chassisEdge} linewidth={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// =============================================================================
// Cargo box — outer wireframe with semi-transparent fill.
// =============================================================================

function CargoBox({ dimensions }: DimensionsProps) {
  const [length, height, width] = toSceneSize(dimensions);
  const center = toScenePos(
    {
      x: dimensions.length_cm / 2,
      y: dimensions.width_cm / 2,
      z: dimensions.height_cm / 2,
    },
    dimensions,
  );

  return (
    <group position={center}>
      {/* side=BackSide only renders the inner faces — from outside the truck
          those are the FAR walls (rear, far side, top from a 3/4 view).
          They act as a soft semi-opaque backdrop that hides edges of stuff
          behind the cargo, while the near walls stay invisible so you can
          still look INTO the load. depthWrite=false avoids occluding items. */}
      <mesh>
        <boxGeometry args={[length, height, width]} />
        <meshBasicMaterial
          transparent
          opacity={0.18}
          color={COLOR.cargoFill}
          side={BackSide}
          depthWrite={false}
        />
        <Edges color={COLOR.cargoEdge} linewidth={1.4} />
      </mesh>
    </group>
  );
}

// =============================================================================
// Cargo deck — semi-transparent floor that pallets sit on.
// =============================================================================

function CargoDeck({ dimensions }: DimensionsProps) {
  const center = toScenePos(
    {
      x: dimensions.length_cm / 2,
      y: dimensions.width_cm / 2,
      z: 0.5,
    },
    dimensions,
  );

  return (
    <mesh position={center} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry
        args={[
          dimensions.length_cm * CM_TO_SCENE,
          dimensions.width_cm * CM_TO_SCENE,
        ]}
      />
      <meshBasicMaterial
        color={COLOR.cargoDeck}
        transparent
        opacity={COLOR.cargoDeckOpacity}
        side={DoubleSide}
      />
    </mesh>
  );
}

// =============================================================================
// Corner pillars — vertical posts at each cargo box corner.
// =============================================================================

function CornerPillars({ dimensions }: DimensionsProps) {
  const pillarThicknessCm = 6;
  const corners: Array<[number, number]> = [
    [0, 0],
    [0, dimensions.width_cm],
    [dimensions.length_cm, 0],
    [dimensions.length_cm, dimensions.width_cm],
  ];

  return (
    <group>
      {corners.map(([x, y], i) => (
        <mesh
          key={i}
          position={toScenePos(
            { x, y, z: dimensions.height_cm / 2 },
            dimensions,
          )}
        >
          <boxGeometry
            args={[
              pillarThicknessCm * CM_TO_SCENE,
              dimensions.height_cm * CM_TO_SCENE,
              pillarThicknessCm * CM_TO_SCENE,
            ]}
          />
          <meshBasicMaterial color={COLOR.cargoPillar} />
          <Edges color={COLOR.cargoEdge} linewidth={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// =============================================================================
// Cabin — body + windshield + side windows + bumper + headlights + mirrors + grille.
// =============================================================================

function Cabin({ dimensions }: DimensionsProps) {
  const cabinLengthCm = SCENE.cabinLengthCm;
  const cabinHeightCm = SCENE.cabinHeightCm;
  const cabinWidthCm = Math.max(120, dimensions.width_cm - 10);
  const gap = SCENE.cabinCargoGapCm;

  const center = toScenePos(
    {
      x: -cabinLengthCm / 2 - gap,
      y: dimensions.width_cm / 2,
      z: cabinHeightCm / 2,
    },
    dimensions,
  );

  const length = cabinLengthCm * CM_TO_SCENE;
  const height = cabinHeightCm * CM_TO_SCENE;
  const width = cabinWidthCm * CM_TO_SCENE;

  return (
    <group position={center}>
      {/* Main body box. side=BackSide renders only the inner faces of the box,
          which from the camera's POV are the FAR walls of the cabin. The near
          walls disappear so we look "through" the front of the cabin without
          their semi-opaque alpha tinting the items behind. depthWrite=false
          stops the wall fill from occluding the window outlines. */}
      <mesh>
        <boxGeometry args={[length, height, width]} />
        <meshBasicMaterial
          transparent
          opacity={0.18}
          color={COLOR.cabinFill}
          side={BackSide}
          depthWrite={false}
        />
        <Edges color={COLOR.cabinEdge} linewidth={1.1} />
      </mesh>

      {/* Side window outlines — rectangles drawn on each lateral cabin face */}
      {[-1, 1].map((side) => {
        const z = side * width * 0.5005;
        const x0 = -length * 0.25;
        const x1 = length * 0.40;
        const y0 = -height * 0.04;
        const y1 = height * 0.36;
        return (
          <Line
            key={`window-${side}`}
            points={[
              [x0, y0, z],
              [x1, y0, z],
              [x1, y1, z],
              [x0, y1, z],
              [x0, y0, z],
            ]}
            color={COLOR.windshieldLine}
            lineWidth={0.8}
            transparent
            opacity={0.55}
          />
        );
      })}

      {/* Front grille — short horizontal lines below the windshield */}
      {[-0.18, -0.27, -0.36].map((yRatio) => (
        <Line
          key={`grille-${yRatio}`}
          points={[
            [-length * 0.5, height * yRatio, -width * 0.28],
            [-length * 0.5, height * yRatio, width * 0.28],
          ]}
          color={COLOR.gridPrimary}
          lineWidth={0.6}
          transparent
          opacity={0.55}
        />
      ))}

      {/* Front bumper bar */}
      <mesh position={[-length * 0.52, -height * 0.46, 0]}>
        <boxGeometry args={[length * 0.06, height * 0.07, width * 0.96]} />
        <meshBasicMaterial color="#0a1014" />
        <Edges color={COLOR.cabinEdge} linewidth={0.9} />
      </mesh>

      {/* Headlights */}
      {[-1, 1].map((side) => (
        <mesh
          key={`headlight-${side}`}
          position={[-length * 0.5, -height * 0.32, side * width * 0.36]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <torusGeometry args={[0.08, 0.012, 6, 18]} />
          <meshBasicMaterial color={COLOR.headlight} transparent opacity={0.9} />
        </mesh>
      ))}

      {/* Side mirrors — small mounted boxes at window height */}
      {[-1, 1].map((side) => (
        <mesh
          key={`mirror-${side}`}
          position={[-length * 0.34, height * 0.18, side * (width * 0.56)]}
        >
          <boxGeometry args={[length * 0.05, height * 0.18, width * 0.04]} />
          <meshBasicMaterial color="#0a1014" />
          <Edges color={COLOR.cabinEdge} linewidth={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// =============================================================================
// Pallets — wood base + colored stack with returnables hatching.
// =============================================================================

interface PalletsProps {
  pallets: VizPallet[];
  truck: DimensionsCm;
  focusedPalletId: string | null;
  onHoverPallet?: (id: string | null) => void;
  onSelectPallet?: (id: string | null) => void;
}

// Tiny vertical lift applied to all pallets to break depth ties with the
// cargo deck plane and the slot grid lines (both sit ~0–1 cm above z=0). At
// 0.018 scene-units-per-cm this is well under a millimetre of rendered lift,
// invisible to the eye but enough to stop the pallet outlines from z-fighting
// with the cargo box / floor lines.
const PALLET_Z_LIFT_SCENE = 0.03;

function Pallets({
  pallets,
  truck,
  focusedPalletId,
  onHoverPallet,
  onSelectPallet,
}: PalletsProps) {
  const isAnyFocused = focusedPalletId !== null;
  return (
    <group position={[0, PALLET_Z_LIFT_SCENE, 0]}>
      {pallets.map((pallet) => {
        const isFocused = focusedPalletId === pallet.pallet_id;
        return (
          <Pallet
            key={pallet.pallet_id}
            pallet={pallet}
            truck={truck}
            isFocused={isFocused}
            dimmed={isAnyFocused && !isFocused}
            onHover={onHoverPallet}
            onSelect={onSelectPallet}
          />
        );
      })}
    </group>
  );
}

interface PalletProps {
  pallet: VizPallet;
  truck: DimensionsCm;
  isFocused: boolean;
  // Some other pallet is focused — fade this one heavily so the focused
  // pallet reads through any pallets that occlude it from the camera.
  dimmed: boolean;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string | null) => void;
}

// Each pallet renders as a wooden base + N stacked layer boxes (one per
// case-height layer of the load). Layers are full-footprint, separated by a
// small visible gap so they read as distinct rows. When the pallet mixes
// multiple product `unit`s, the footprint splits along its length axis into
// one strip per distinct unit (each strip in its own color). BRL partitions
// keep the cylinder render; everything else renders as boxes.
const LAYER_TARGET_CM = 30; // approximate visual height per layer
const LAYER_GAP_CM = 0.4; // visible seam between layers
const STACK_GAP_CM = 0.6;

// Per-strip length share clamps when a pallet has multiple units. Below the
// floor a partition is too thin to read; above the ceiling the others
// collapse. Single-unit pallets always get the full length, regardless.
const PARTITION_FLOOR = 0.18;
const PARTITION_CEILING = 0.82;

// Pallet-slot footprint per unit, mirrors backendLoadAdapter.UNIT_FOOTPRINT.
// Used here to size each unit's strip proportionally to the floor it would
// actually occupy — not just product count.
const UNIT_FOOTPRINT: Record<string, number> = {
  CAJ: 1.0,
  ZPR: 1.0,
  PAK: 1.0,
  EST: 1.0,
  KG:  1.0,
  UN:  0.2,
  BOT: 0.1,
  TB:  0.8,
  PQ:  0.8,
  BID: 1.5,
  BRL: 4.0,
};

type Partition = {
  // Driving identity — both color (paletteForUnit) and shape (BRL → cylinder)
  // come from this. `kind` is kept for back-compat with code paths that may
  // still inspect it; new code should branch on `unit`.
  unit: string;
  kind: PalletKind;
  // Local offset from the pallet's origin along its length axis (cm).
  offsetXcm: number;
  lengthCm: number;
  widthCm: number;
  products: Product[];
};

function partitionPallet(
  products: Product[],
  totalLengthCm: number,
  totalWidthCm: number,
  fallbackKind: PalletKind,
): Partition[] {
  if (products.length === 0) {
    return [
      {
        unit: "CAJ",
        kind: fallbackKind,
        offsetXcm: 0,
        lengthCm: totalLengthCm,
        widthCm: totalWidthCm,
        products: [],
      },
    ];
  }

  // Group products by unit, preserving first-seen order so the strip layout
  // is stable across renders for the same pallet.
  const order: string[] = [];
  const byUnit = new Map<string, Product[]>();
  for (const p of products) {
    const u = p.unit.toUpperCase();
    if (!byUnit.has(u)) {
      byUnit.set(u, []);
      order.push(u);
    }
    byUnit.get(u)!.push(p);
  }

  if (order.length === 1) {
    const unit = order[0]!;
    return [
      {
        unit,
        kind: unit === "BRL" ? "barrel" : fallbackKind === "barrel"
          ? "case-bottle"
          : fallbackKind,
        offsetXcm: 0,
        lengthCm: totalLengthCm,
        widthCm: totalWidthCm,
        products: byUnit.get(unit)!,
      },
    ];
  }

  // Multi-unit pallet: share length proportionally to each unit's slot
  // footprint (quantity × per-unit factor). Then clamp shares so no strip
  // collapses or hogs the whole pallet.
  const slotsByUnit = order.map((u) =>
    byUnit
      .get(u)!
      .reduce((sum, p) => sum + p.cases * (UNIT_FOOTPRINT[u] ?? 1), 0),
  );
  const total = slotsByUnit.reduce((a, b) => a + b, 0);
  const rawShares = slotsByUnit.map((s) =>
    total > 0 ? s / total : 1 / order.length,
  );
  const clamped = rawShares.map((s) =>
    Math.max(PARTITION_FLOOR, Math.min(PARTITION_CEILING, s)),
  );
  const sumClamped = clamped.reduce((a, b) => a + b, 0);
  const normalized = clamped.map((s) => s / sumClamped);

  let cursor = 0;
  return order.map((unit, i) => {
    const lengthCm = totalLengthCm * normalized[i]!;
    const part: Partition = {
      unit,
      kind: unit === "BRL" ? "barrel" : "case-bottle",
      offsetXcm: cursor,
      lengthCm,
      widthCm: totalWidthCm,
      products: byUnit.get(unit)!,
    };
    cursor += lengthCm;
    return part;
  });
}

function Pallet({
  pallet,
  truck,
  isFocused,
  dimmed,
  onHover,
  onSelect,
}: PalletProps) {
  const totalHeightRaw = safe(pallet.dims.height_cm, 1);
  const baseHeight = Math.min(SCENE.palletBaseHeightCm, totalHeightRaw);
  const stackHeightRaw = Math.max(0, totalHeightRaw - baseHeight);
  const totalHeight = baseHeight + stackHeightRaw;

  const baseDims: DimensionsCm = {
    length_cm: pallet.dims.length_cm,
    width_cm: pallet.dims.width_cm,
    height_cm: baseHeight,
  };
  const [baseLength, baseHeightUnit, baseWidth] = toSceneSize(baseDims);

  const baseCenter = toScenePos(
    {
      x: pallet.position.x + pallet.dims.length_cm / 2,
      y: pallet.position.y + pallet.dims.width_cm / 2,
      z: pallet.position.z + baseHeight / 2,
    },
    truck,
  );

  const isEmpty = pallet.is_empty || pallet.products.length === 0;

  const partitions = useMemo(
    () =>
      isEmpty
        ? []
        : partitionPallet(
            pallet.products,
            pallet.dims.length_cm,
            pallet.dims.width_cm,
            pallet.kind,
          ),
    [
      isEmpty,
      pallet.products,
      pallet.dims.length_cm,
      pallet.dims.width_cm,
      pallet.kind,
    ],
  );

  // All pallets stay fully opaque except when something else is hovered.
  const targetFillOpacity = dimmed ? 0.06 : 1;
  const targetEdgeOpacity = dimmed ? 0.08 : 1;

  const baseMatRef = useRef<MeshBasicMaterial>(null);
  const baseEdgesRef = useRef<Mesh | null>(
    null,
  ) as React.MutableRefObject<Mesh | null>;

  useFrame((_, delta) => {
    const lambda = 9;
    const snapOpaque = !dimmed;

    const m1 = baseMatRef.current;
    if (m1) {
      m1.opacity = snapOpaque
        ? 1
        : MathUtils.damp(m1.opacity, targetFillOpacity, lambda, delta);
      m1.depthWrite = m1.opacity > 0.95;
    }

    const baseEdgeMat = singleMaterial(baseEdgesRef.current);
    if (baseEdgeMat) {
      if (!baseEdgeMat.transparent) {
        baseEdgeMat.transparent = true;
        baseEdgeMat.needsUpdate = true;
      }
      baseEdgeMat.opacity = snapOpaque
        ? 1
        : MathUtils.damp(
            baseEdgeMat.opacity,
            targetEdgeOpacity,
            lambda,
            delta,
          );
      baseEdgeMat.depthWrite = false;
    }
  });

  // Single invisible hitbox per pallet wrapping the whole base + stack volume.
  // Pointer events live ONLY on this mesh; partition meshes have raycast
  // disabled below so the hover state can't flicker as the cursor crosses
  // gaps between layer boxes / cylinders.
  const hitboxCenter = toScenePos(
    {
      x: pallet.position.x + pallet.dims.length_cm / 2,
      y: pallet.position.y + pallet.dims.width_cm / 2,
      z: pallet.position.z + totalHeight / 2,
    },
    truck,
  );
  const hitboxSize = toSceneSize({
    length_cm: pallet.dims.length_cm,
    width_cm: pallet.dims.width_cm,
    height_cm: Math.max(totalHeight, baseHeight + STACK_GAP_CM),
  });

  return (
    <group>
      {!isEmpty && (
        <mesh
          position={hitboxCenter}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover?.(pallet.pallet_id);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            onHover?.(null);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(pallet.pallet_id);
          }}
        >
          <boxGeometry args={hitboxSize} />
          <meshBasicMaterial
            transparent
            opacity={0}
            depthWrite={false}
            colorWrite={false}
          />
        </mesh>
      )}

      <group position={baseCenter}>
        <mesh renderOrder={isFocused ? 10 : 0} raycast={NO_RAYCAST}>
          <boxGeometry args={[baseLength, baseHeightUnit, baseWidth]} />
          <meshBasicMaterial
            ref={baseMatRef}
            color={COLOR.palletBase}
            transparent
            opacity={1}
            depthWrite={false}
          />
          <Edges
            ref={baseEdgesRef as unknown as React.Ref<never>}
            color={COLOR.palletBaseEdge}
            linewidth={0.9}
          />
        </mesh>
      </group>

      {partitions.map((partition, i) => (
        <PalletPartition
          key={`${partition.unit}-${i}`}
          pallet={pallet}
          truck={truck}
          partition={partition}
          baseHeight={baseHeight}
          stackHeightRaw={stackHeightRaw}
          isFocused={isFocused}
          dimmed={dimmed}
        />
      ))}
    </group>
  );
}

// Shared raycast-off function so all decorative meshes drop pointer events
// without allocating a new closure per render.
const NO_RAYCAST = () => undefined;

interface PalletPartitionProps {
  pallet: VizPallet;
  truck: DimensionsCm;
  partition: Partition;
  baseHeight: number;
  stackHeightRaw: number;
  isFocused: boolean;
  dimmed: boolean;
}

// Renders one partition's contents on the pallet base. Cases get N stacked
// layered boxes filling the sub-footprint; barrels get a 2x2 grid of
// cylinders (or 1x2 / 2x1 when the sub-footprint is short along one axis).
function PalletPartition({
  pallet,
  truck,
  partition,
  baseHeight,
  stackHeightRaw,
  isFocused,
  dimmed,
}: PalletPartitionProps) {
  const heightFactor = heightFactorForKind(partition.kind);
  const stackHeight = stackHeightRaw * heightFactor;
  const isBarrel = partition.unit === "BRL";
  const palette = paletteForUnit(partition.unit);
  const fillColor = palette.fill;
  const edgeColor = palette.edge;

  // Center of this partition's footprint, in pallet-local cm before scene
  // transform. Length axis (x) is offset by the partition's start.
  const partCenterXcm =
    pallet.position.x + partition.offsetXcm + partition.lengthCm / 2;
  const partCenterYcm = pallet.position.y + partition.widthCm / 2;

  const layerPlan = useMemo(() => {
    if (isBarrel || stackHeight === 0) return null;
    const numLayers = Math.max(1, Math.round(stackHeight / LAYER_TARGET_CM));
    const slotHeight = stackHeight / numLayers;
    const meshHeight = Math.max(1, slotHeight - LAYER_GAP_CM);
    const centersZcm: number[] = [];
    for (let i = 0; i < numLayers; i++) {
      centersZcm.push(i * slotHeight + meshHeight / 2);
    }
    return { meshHeight, centersZcm };
  }, [isBarrel, stackHeight]);

  // Barrel grid sizing — 2 rows × N cols where N depends on how much length
  // the partition has (each cell needs ~36 cm of length to fit a barrel of
  // reasonable diameter). A barrel-only pallet lands on the original 2x2;
  // a narrow mixed partition collapses to 2x1.
  const barrelPlan = useMemo(() => {
    if (!isBarrel || stackHeight === 0) return null;
    const rows = 2;
    const cellMinCm = 36;
    const cols = Math.max(1, Math.floor(partition.lengthCm / cellMinCm));
    const cellL = partition.lengthCm / cols;
    const cellW = partition.widthCm / rows;
    const diameterCm = Math.min(cellL, cellW) * 0.92;
    const offsetsCm: Array<[number, number]> = [];
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        offsetsCm.push([
          (i + 0.5) * cellL - partition.lengthCm / 2,
          (j + 0.5) * cellW - partition.widthCm / 2,
        ]);
      }
    }
    return { offsetsCm, diameterCm, heightCm: stackHeight };
  }, [isBarrel, stackHeight, partition.lengthCm, partition.widthCm]);

  const layerGeo = useMemo(() => {
    if (!layerPlan) return null;
    return new BoxGeometry(
      partition.lengthCm * CM_TO_SCENE,
      layerPlan.meshHeight * CM_TO_SCENE,
      partition.widthCm * CM_TO_SCENE,
    );
  }, [partition.lengthCm, partition.widthCm, layerPlan]);
  const layerEdgesGeo = useMemo(
    () => (layerGeo ? new EdgesGeometry(layerGeo) : null),
    [layerGeo],
  );

  const barrelGeo = useMemo(() => {
    if (!barrelPlan) return null;
    const radius = (barrelPlan.diameterCm / 2) * CM_TO_SCENE;
    const height = barrelPlan.heightCm * CM_TO_SCENE;
    return new CylinderGeometry(radius, radius, height, 24, 1);
  }, [barrelPlan]);
  const barrelEdgesGeo = useMemo(
    () => (barrelGeo ? new EdgesGeometry(barrelGeo) : null),
    [barrelGeo],
  );

  const fillMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color: fillColor,
        transparent: true,
        opacity: 1,
        depthWrite: false,
      }),
    [fillColor],
  );
  const edgeMat = useMemo(
    () =>
      new LineBasicMaterial({
        color: edgeColor,
        transparent: true,
        opacity: 1,
      }),
    [edgeColor],
  );

  useEffect(
    () => () => {
      layerGeo?.dispose();
      layerEdgesGeo?.dispose();
      barrelGeo?.dispose();
      barrelEdgesGeo?.dispose();
      fillMat.dispose();
      edgeMat.dispose();
    },
    [layerGeo, layerEdgesGeo, barrelGeo, barrelEdgesGeo, fillMat, edgeMat],
  );

  const layerCenters = useMemo<Array<[number, number, number]>>(() => {
    if (!layerPlan) return [];
    return layerPlan.centersZcm.map((zCm) =>
      toScenePos(
        {
          x: partCenterXcm,
          y: partCenterYcm,
          z: pallet.position.z + baseHeight + STACK_GAP_CM + zCm,
        },
        truck,
      ),
    );
  }, [partCenterXcm, partCenterYcm, pallet.position.z, baseHeight, truck, layerPlan]);

  const barrelCenters = useMemo<Array<[number, number, number]>>(() => {
    if (!barrelPlan) return [];
    const cz =
      pallet.position.z + baseHeight + STACK_GAP_CM + barrelPlan.heightCm / 2;
    return barrelPlan.offsetsCm.map(([dxCm, dyCm]) =>
      toScenePos(
        { x: partCenterXcm + dxCm, y: partCenterYcm + dyCm, z: cz },
        truck,
      ),
    );
  }, [partCenterXcm, partCenterYcm, pallet.position.z, baseHeight, truck, barrelPlan]);

  // Animation: dim out when another pallet is hovered. Only target opacity is
  // damped down — fully opaque is snapped on the way back to avoid the
  // newly-focused pallet showing a lingering transparency from a prior dim.
  const targetFillOpacity = dimmed ? 0.06 : 1;
  const targetEdgeOpacity = dimmed ? 0.08 : 1;

  useFrame((_, delta) => {
    const lambda = 9;
    const snapOpaque = !dimmed;
    fillMat.opacity = snapOpaque
      ? 1
      : MathUtils.damp(fillMat.opacity, targetFillOpacity, lambda, delta);
    fillMat.depthWrite = fillMat.opacity > 0.95;
    edgeMat.opacity = snapOpaque
      ? 1
      : MathUtils.damp(edgeMat.opacity, targetEdgeOpacity, lambda, delta);
    edgeMat.depthWrite = false;
  });

  return (
    <>
      {layerGeo &&
        layerEdgesGeo &&
        layerCenters.map((center, i) => (
          <group key={i} position={center}>
            <mesh
              geometry={layerGeo}
              material={fillMat}
              renderOrder={isFocused ? 10 : 0}
              raycast={NO_RAYCAST}
            />
            <lineSegments
              geometry={layerEdgesGeo}
              material={edgeMat}
              renderOrder={isFocused ? 11 : 1}
              raycast={NO_RAYCAST}
            />
          </group>
        ))}

      {barrelGeo &&
        barrelEdgesGeo &&
        barrelCenters.map((center, i) => (
          <group key={i} position={center}>
            <mesh
              geometry={barrelGeo}
              material={fillMat}
              renderOrder={isFocused ? 10 : 0}
              raycast={NO_RAYCAST}
            />
            <lineSegments
              geometry={barrelEdgesGeo}
              material={edgeMat}
              renderOrder={isFocused ? 11 : 1}
              raycast={NO_RAYCAST}
            />
          </group>
        ))}
    </>
  );
}

// drei <Edges> exposes its underlying THREE.LineSegments via forwardRef. Some
// Three.js objects can hold a Material[] but Edges always uses one, so this
// helper narrows that down — and returns null if the segments aren't mounted
// yet (first frame after mount).
function singleMaterial(
  obj: Mesh | null,
): (Material & { opacity: number; transparent: boolean }) | null {
  if (!obj) return null;
  const mat = obj.material;
  if (Array.isArray(mat)) return null;
  return mat as Material & { opacity: number; transparent: boolean };
}

// =============================================================================
// Wheels — adapts axle layout per truck length.
// =============================================================================

function WheelSet({ dimensions }: DimensionsProps) {
  const isVan = isVanLayout(dimensions);
  const wheelRadiusCm = isVan
    ? SCENE.vanWheelRadiusCm
    : SCENE.truckWheelRadiusCm;

  let axleXs: number[];
  if (isVan) {
    axleXs = [
      SCENE.vanFrontAxleCm,
      dimensions.length_cm * SCENE.vanRearAxleAt,
    ];
  } else {
    // Use absolute spacing for the tandem so the two rear wheels never overlap
    // (with proportional ratios they touched on shorter trucks).
    const tandemRearX = dimensions.length_cm * SCENE.truckTandemRearAt;
    const tandemFrontX = tandemRearX - SCENE.truckTandemSpacingCm;
    axleXs = [SCENE.truckFrontAxleCm, tandemFrontX, tandemRearX];
  }

  const sideY = [
    -SCENE.wheelOutwardCm,
    dimensions.width_cm + SCENE.wheelOutwardCm,
  ];

  return (
    <group>
      {axleXs.flatMap((x) =>
        sideY.map((y) => (
          <Wheel
            key={`${x}-${y}`}
            position={toScenePos({ x, y, z: wheelRadiusCm }, dimensions)}
            radius={wheelRadiusCm * CM_TO_SCENE}
          />
        )),
      )}
    </group>
  );
}

interface WheelProps {
  position: [number, number, number];
  radius: number;
}

function Wheel({ position, radius }: WheelProps) {
  // Thicker rubber tire + deeper hub for a more substantial, less ring-like look.
  const tubeRadius = radius * 0.36;
  const hubRadius = radius * 0.44;
  const hubDepth = tubeRadius * 1.85;
  const capRadius = hubRadius * 0.32;

  return (
    <group position={position}>
      <mesh>
        <torusGeometry args={[radius, tubeRadius, 14, 56]} />
        <meshBasicMaterial color={COLOR.tireRubber} />
        <Edges color={COLOR.tireEdge} linewidth={1.0} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[hubRadius, hubRadius, hubDepth, 28]} />
        <meshBasicMaterial color={COLOR.hub} />
        <Edges color={COLOR.hubAccent} linewidth={0.8} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry
          args={[capRadius, capRadius, hubDepth * 1.08, 18]}
        />
        <meshBasicMaterial color={COLOR.hubCap} />
      </mesh>
    </group>
  );
}

// =============================================================================
// Yard floor — subtle radial grid under the truck.
// =============================================================================

function YardFloor() {
  const radius = 9;
  const ringCount = 5;
  const radialCount = 24;

  const rings = useMemo(
    () =>
      Array.from({ length: ringCount }, (_, ringIndex) => {
        const ringRadius = ((ringIndex + 1) / ringCount) * radius;
        const segments = 96;
        return Array.from({ length: segments + 1 }, (_, segmentIndex) => {
          const angle = (segmentIndex / segments) * Math.PI * 2;
          return [
            Math.cos(angle) * ringRadius,
            0,
            Math.sin(angle) * ringRadius,
          ] as [number, number, number];
        });
      }),
    [],
  );

  const radials = useMemo(
    () =>
      Array.from({ length: radialCount }, (_, index) => {
        const angle = (index / radialCount) * Math.PI * 2;
        return [
          [0, 0, 0] as [number, number, number],
          [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [
            number,
            number,
            number,
          ],
        ];
      }),
    [],
  );

  return (
    <group position={[0, -1.27, 0]}>
      {rings.map((ringPoints, index) => (
        <Line
          key={`ring-${index}`}
          points={ringPoints}
          color={
            index === ringCount - 1 ? COLOR.gridPrimary : COLOR.gridSecondary
          }
          lineWidth={index === ringCount - 1 ? 0.5 : 0.3}
          transparent
          opacity={index === ringCount - 1 ? 0.32 : 0.22}
        />
      ))}
      {radials.map((segment, index) => (
        <Line
          key={`radial-${index}`}
          points={segment}
          color={COLOR.gridSecondary}
          lineWidth={0.25}
          transparent
          opacity={0.15}
        />
      ))}
    </group>
  );
}
