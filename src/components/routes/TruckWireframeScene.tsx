"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Edges,
  Instance,
  Instances,
  Line,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import { useMemo, useRef } from "react";
import { DoubleSide, type Group } from "three";
import type {
  DimensionsCm,
  PositionCm,
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

// Cargo unit footprints, aligned with backend ProductDimensions defaults.
// Used to build the per-item visualization inside each pallet.
//   1 bottle case = 1 unit footprint (40×30 cm).
//   1 can case    ≈ 0.8 unit          (33×24 cm).
//   1 barrel      ≈ 4 units (cylinder, 60 cm Ø × 60 cm tall).
const ITEM = {
  caseBottle: { length_cm: 40, width_cm: 30, height_cm: 25 },
  caseCan: { length_cm: 33, width_cm: 24, height_cm: 25 },
  barrel: { radius_cm: 30, height_cm: 60 },
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
  hoveredPalletId?: string | null;
  onHoverPallet?: (id: string | null) => void;
}

export function TruckWireframeScene({
  visualization,
  hoveredPalletId = null,
  onHoverPallet,
}: TruckWireframeSceneProps) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      shadows={false}
      onPointerMissed={() => onHoverPallet?.(null)}
    >
      <color attach="background" args={[COLOR.bg]} />
      <fog attach="fog" args={[COLOR.fog, 14, 32]} />
      <hemisphereLight args={["#bce7ff", "#0a0f14", 0.55]} />
      <pointLight position={[5, 8, 4]} intensity={0.8} color="#78e7ff" />
      <pointLight position={[-5, 3, -4]} intensity={0.4} color="#ff6b9a" />

      <AdaptiveCamera dimensions={visualization.truck_dims} />
      <YardFloor />
      <Stage
        visualization={visualization}
        hoveredPalletId={hoveredPalletId}
        onHoverPallet={onHoverPallet}
      />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minDistance={6}
        maxDistance={22}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.5}
        target={[0.2, 2.0, 0]}
      />
    </Canvas>
  );
}

// =============================================================================
// Camera — scales the framing with truck length so van and 8pal both fit nicely.
// =============================================================================

function AdaptiveCamera({ dimensions }: DimensionsProps) {
  const { size } = useThree();
  const isNarrow = size.width < 700;
  const lengthFactor = Math.max(0.78, safe(dimensions.length_cm, 540) / 620);

  return (
    <PerspectiveCamera
      makeDefault
      position={
        isNarrow
          ? [10.4 * lengthFactor, 6.6, 16.4 * lengthFactor]
          : [8.6 * lengthFactor, 5.4, 12.4 * lengthFactor]
      }
      fov={isNarrow ? 52 : 42}
    />
  );
}

// =============================================================================
// Stage — root truck group, applies idle bob + 3/4 view rotation.
// =============================================================================

function Stage({
  visualization,
  hoveredPalletId,
  onHoverPallet,
}: {
  visualization: TruckVisualization;
  hoveredPalletId: string | null;
  onHoverPallet?: (id: string | null) => void;
}) {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y =
      -1.25 + Math.sin(clock.elapsedTime * 0.5) * 0.02;
  });

  return (
    <group ref={groupRef} rotation={[0, -0.42, 0]} position={[0, -1.25, 0]}>
      {/* Body sub-group is lifted by chassis height. Wheels stay at ground. */}
      <group position={[0, CHASSIS_LIFT_SCENE, 0]}>
        <Chassis dimensions={visualization.truck_dims} />
        <CargoBox dimensions={visualization.truck_dims} />
        <CargoDeck dimensions={visualization.truck_dims} />
        <CargoSlotGrid dimensions={visualization.truck_dims} />
        <CargoRibs dimensions={visualization.truck_dims} />
        <CornerPillars dimensions={visualization.truck_dims} />
        <RearDoor dimensions={visualization.truck_dims} />
        <Cabin dimensions={visualization.truck_dims} />
        <Pallets
          pallets={visualization.pallets}
          truck={visualization.truck_dims}
          hoveredPalletId={hoveredPalletId}
          onHoverPallet={onHoverPallet}
        />
      </group>
      <WheelSet dimensions={visualization.truck_dims} />
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
      <mesh>
        <boxGeometry args={[length, height, width]} />
        <meshBasicMaterial
          transparent
          opacity={COLOR.cargoFillOpacity}
          color={COLOR.cargoFill}
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
// Slot grid — subtle grid drawn on top of the deck (slot dimensions).
// =============================================================================

function CargoSlotGrid({ dimensions }: DimensionsProps) {
  const slotLengthCm = 120;
  const slotWidthCm = 80;
  const slotsLong = Math.max(1, Math.floor(dimensions.length_cm / slotLengthCm));
  const slotsWide = Math.max(1, Math.floor(dimensions.width_cm / slotWidthCm));
  const usedLength = slotsLong * slotLengthCm;
  const usedWidth = slotsWide * slotWidthCm;
  const offsetX = (dimensions.length_cm - usedLength) / 2;
  const offsetY = (dimensions.width_cm - usedWidth) / 2;
  const z = 1.2;

  const lines: Array<[PositionCm, PositionCm]> = [];

  for (let i = 0; i <= slotsLong; i += 1) {
    const x = offsetX + i * slotLengthCm;
    lines.push([
      { x, y: offsetY, z },
      { x, y: offsetY + usedWidth, z },
    ]);
  }

  for (let j = 0; j <= slotsWide; j += 1) {
    const y = offsetY + j * slotWidthCm;
    lines.push([
      { x: offsetX, y, z },
      { x: offsetX + usedLength, y, z },
    ]);
  }

  return (
    <group>
      {lines.map((segment, index) => (
        <Line
          key={index}
          points={[
            toScenePos(segment[0], dimensions),
            toScenePos(segment[1], dimensions),
          ]}
          color={COLOR.gridPrimary}
          lineWidth={0.5}
          transparent
          opacity={0.22}
        />
      ))}
    </group>
  );
}

// =============================================================================
// Side ribs — horizontal panel suggestion lines on each side wall.
// =============================================================================

function CargoRibs({ dimensions }: DimensionsProps) {
  const ribHeights = [0.32, 0.55, 0.78].map((r) => r * dimensions.height_cm);
  const sides = [0, dimensions.width_cm];

  return (
    <group>
      {sides.flatMap((y) =>
        ribHeights.map((z) => (
          <Line
            key={`rib-${y}-${z}`}
            points={[
              toScenePos({ x: 0, y, z }, dimensions),
              toScenePos({ x: dimensions.length_cm, y, z }, dimensions),
            ]}
            color={COLOR.rib}
            lineWidth={0.4}
            transparent
            opacity={COLOR.ribOpacity}
          />
        )),
      )}
    </group>
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
// Rear door — vertical seams + horizontal hinge lines + handle.
// =============================================================================

function RearDoor({ dimensions }: DimensionsProps) {
  const xRear = dimensions.length_cm;
  const handleZ = dimensions.height_cm * 0.45;

  const seamYs = [0.25, 0.5, 0.75].map((r) => r * dimensions.width_cm);
  const hingeZs = [0.18, 0.82].map((r) => r * dimensions.height_cm);

  return (
    <group>
      {seamYs.map((y) => (
        <Line
          key={`seam-${y}`}
          points={[
            toScenePos({ x: xRear, y, z: 0 }, dimensions),
            toScenePos({ x: xRear, y, z: dimensions.height_cm }, dimensions),
          ]}
          color={COLOR.rearDoor}
          lineWidth={0.6}
          transparent
          opacity={COLOR.rearDoorOpacity}
        />
      ))}

      {hingeZs.map((z) => (
        <Line
          key={`hinge-${z}`}
          points={[
            toScenePos({ x: xRear, y: 0, z }, dimensions),
            toScenePos({ x: xRear, y: dimensions.width_cm, z }, dimensions),
          ]}
          color={COLOR.rearDoor}
          lineWidth={0.5}
          transparent
          opacity={0.4}
        />
      ))}

      <mesh
        position={toScenePos(
          { x: xRear, y: dimensions.width_cm / 2, z: handleZ },
          dimensions,
        )}
        rotation={[0, 0, Math.PI / 2]}
      >
        <torusGeometry args={[0.08, 0.012, 8, 24]} />
        <meshBasicMaterial color={COLOR.rearDoor} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

// =============================================================================
// Cabin — body + windshield + side windows + bumper + headlights + mirrors + grille.
// =============================================================================

function Cabin({ dimensions }: DimensionsProps) {
  const cabinLengthCm = 170;
  const cabinHeightCm = 200;
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

  // Windshield outline: traces the inclined glass on the cabin top-front edge.
  //   Cabin local axes: X = length (front is -X), Y = height (up), Z = width.
  //   Top-front edge of cabin: x = -length/2, y = +height/2, z varies along width.
  //   Windshield base bends down/forward to x = -length*0.30, y = +height*0.10.
  const wsTopX = -length * 0.5;
  const wsTopY = height * 0.5;
  const wsBottomX = -length * 0.32;
  const wsBottomY = height * 0.12;
  const wsZ = width * 0.49;

  return (
    <group position={center}>
      {/* Main body box */}
      <mesh>
        <boxGeometry args={[length, height, width]} />
        <meshBasicMaterial
          transparent
          opacity={COLOR.cabinFillOpacity}
          color={COLOR.cabinFill}
        />
        <Edges color={COLOR.cabinEdge} linewidth={1.1} />
      </mesh>

      {/* Windshield outline — frame around the inclined glass, drawn as lines on
          each side wall of the cabin and connected across the top. */}
      {[-1, 1].map((side) => (
        <Line
          key={`wsframe-${side}`}
          points={[
            [wsBottomX, wsBottomY, side * wsZ],
            [wsTopX, wsTopY, side * wsZ],
          ]}
          color={COLOR.windshieldLine}
          lineWidth={1.0}
          transparent
          opacity={0.75}
        />
      ))}
      <Line
        points={[
          [wsBottomX, wsBottomY, -wsZ],
          [wsBottomX, wsBottomY, wsZ],
        ]}
        color={COLOR.windshieldLine}
        lineWidth={1.0}
        transparent
        opacity={0.75}
      />

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
  hoveredPalletId: string | null;
  onHoverPallet?: (id: string | null) => void;
}

function Pallets({
  pallets,
  truck,
  hoveredPalletId,
  onHoverPallet,
}: PalletsProps) {
  return (
    <group>
      {pallets.map((pallet) => (
        <Pallet
          key={pallet.pallet_id}
          pallet={pallet}
          truck={truck}
          isHovered={hoveredPalletId === pallet.pallet_id}
          onHover={onHoverPallet}
        />
      ))}
    </group>
  );
}

interface PalletProps {
  pallet: VizPallet;
  truck: DimensionsCm;
  isHovered: boolean;
  onHover?: (id: string | null) => void;
}

type ItemKind = "case-bottle" | "case-can" | "barrel" | null;

function detectItemKind(pallet: VizPallet): ItemKind {
  if (pallet.is_return) return null;
  const s = pallet.products_summary.join(" ").toLowerCase();
  if (/barrel|barril|gas/.test(s)) return "barrel";
  if (/can|lat[ae]|soft\s*drink/.test(s)) return "case-can";
  return "case-bottle";
}

// Pack same-size items into rows × columns × layers inside the pallet stack
// volume. Returns each item's center position in pallet-local cm coords.
function packGrid(
  pallet: VizPallet,
  cellL: number,
  cellW: number,
  cellH: number,
): Array<[number, number, number]> {
  const stackH = Math.max(
    0,
    safe(pallet.dims.height_cm, 0) - SCENE.palletBaseHeightCm,
  );
  const layers = Math.max(0, Math.floor(stackH / cellH));
  const colsX = Math.max(1, Math.floor(safe(pallet.dims.length_cm, 1) / cellL));
  const colsY = Math.max(1, Math.floor(safe(pallet.dims.width_cm, 1) / cellW));
  const padX = (pallet.dims.length_cm - colsX * cellL) / 2;
  const padY = (pallet.dims.width_cm - colsY * cellW) / 2;
  const positions: Array<[number, number, number]> = [];
  for (let layer = 0; layer < layers; layer++) {
    for (let cy = 0; cy < colsY; cy++) {
      for (let cx = 0; cx < colsX; cx++) {
        positions.push([
          padX + cx * cellL + cellL / 2,
          padY + cy * cellW + cellW / 2,
          SCENE.palletBaseHeightCm + layer * cellH + cellH / 2,
        ]);
      }
    }
  }
  return positions;
}

interface PalletItemsProps {
  pallet: VizPallet;
  truck: DimensionsCm;
}

function PalletItems({ pallet, truck }: PalletItemsProps) {
  const kind = useMemo(() => detectItemKind(pallet), [pallet]);

  // Compute item positions once per pallet/kind.
  const positions = useMemo(() => {
    if (kind === "barrel") {
      const cell = ITEM.barrel.radius_cm * 2;
      return packGrid(pallet, cell, cell, ITEM.barrel.height_cm);
    }
    if (kind === "case-can") {
      return packGrid(
        pallet,
        ITEM.caseCan.length_cm,
        ITEM.caseCan.width_cm,
        ITEM.caseCan.height_cm,
      );
    }
    if (kind === "case-bottle") {
      return packGrid(
        pallet,
        ITEM.caseBottle.length_cm,
        ITEM.caseBottle.width_cm,
        ITEM.caseBottle.height_cm,
      );
    }
    return [];
  }, [pallet, kind]);

  if (kind === null || positions.length === 0) return null;

  const scenePositions = positions.map(([px, py, pz]) =>
    toScenePos(
      {
        x: pallet.position.x + px,
        y: pallet.position.y + py,
        z: pallet.position.z + pz,
      },
      truck,
    ),
  );

  if (kind === "barrel") {
    return (
      <Instances limit={positions.length}>
        <cylinderGeometry
          args={[
            ITEM.barrel.radius_cm * CM_TO_SCENE,
            ITEM.barrel.radius_cm * CM_TO_SCENE,
            ITEM.barrel.height_cm * CM_TO_SCENE,
            18,
          ]}
        />
        <meshBasicMaterial color={pallet.color} />
        {scenePositions.map((pos, i) => (
          <Instance key={i} position={pos} />
        ))}
      </Instances>
    );
  }

  const dim = kind === "case-can" ? ITEM.caseCan : ITEM.caseBottle;
  return (
    <Instances limit={positions.length}>
      <boxGeometry
        args={[
          dim.length_cm * CM_TO_SCENE,
          dim.height_cm * CM_TO_SCENE,
          dim.width_cm * CM_TO_SCENE,
        ]}
      />
      <meshBasicMaterial color={pallet.color} />
      {scenePositions.map((pos, i) => (
        <Instance key={i} position={pos} />
      ))}
    </Instances>
  );
}

function Pallet({ pallet, truck, isHovered, onHover }: PalletProps) {
  const totalHeight = safe(pallet.dims.height_cm, 1);
  const baseHeight = Math.min(SCENE.palletBaseHeightCm, totalHeight);
  const stackHeight = Math.max(0, totalHeight - baseHeight);

  const baseDims: DimensionsCm = {
    length_cm: pallet.dims.length_cm,
    width_cm: pallet.dims.width_cm,
    height_cm: baseHeight,
  };
  const stackDims: DimensionsCm = {
    length_cm: pallet.dims.length_cm,
    width_cm: pallet.dims.width_cm,
    height_cm: stackHeight,
  };

  const [baseLength, baseHeightUnit, baseWidth] = toSceneSize(baseDims);
  const [stackLength, stackHeightUnit, stackWidth] = toSceneSize(stackDims);

  const baseCenter = toScenePos(
    {
      x: pallet.position.x + pallet.dims.length_cm / 2,
      y: pallet.position.y + pallet.dims.width_cm / 2,
      z: pallet.position.z + baseHeight / 2,
    },
    truck,
  );
  const stackCenter = toScenePos(
    {
      x: pallet.position.x + pallet.dims.length_cm / 2,
      y: pallet.position.y + pallet.dims.width_cm / 2,
      z: pallet.position.z + baseHeight + stackHeight / 2,
    },
    truck,
  );

  const isReturn = pallet.is_return;

  // Returnables get a wireframe-only render with a dashed hatching pattern on
  // the top face to signal "empty containers". No transparent fill anywhere on
  // the stack — that was the source of the angle-dependent face flicker.
  const hatchLines = useMemo(() => {
    if (!isReturn || stackHeight <= 0) return [];
    const linesCount = 4;
    const top = stackHeightUnit / 2 + 0.005;
    return Array.from({ length: linesCount }, (_, i) => {
      const t = (i + 0.5) / linesCount;
      return [
        [-stackLength / 2, top, -stackWidth / 2 + stackWidth * t] as [
          number,
          number,
          number,
        ],
        [stackLength / 2, top, -stackWidth / 2 + stackWidth * t] as [
          number,
          number,
          number,
        ],
      ];
    });
  }, [isReturn, stackHeight, stackHeightUnit, stackLength, stackWidth]);

  const edgeWidth = isHovered ? 2.0 : 1.3;

  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover?.(pallet.pallet_id);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover?.(null);
      }}
    >
      {/* Pallet base (wood/plastic platform). */}
      <group position={baseCenter}>
        <mesh>
          <boxGeometry args={[baseLength, baseHeightUnit, baseWidth]} />
          <meshBasicMaterial
            transparent
            opacity={COLOR.palletBaseOpacity}
            color={COLOR.palletBase}
            depthWrite={false}
          />
          <Edges color={COLOR.palletBaseEdge} linewidth={0.9} />
        </mesh>
      </group>

      {/* Real cargo items: cases (boxes) for bottles/cans, cylinders for barrels.
          Solid materials and instanced rendering — no transparency, so the look
          is identical from any camera angle. */}
      {!isReturn && stackHeight > 0 && (
        <PalletItems pallet={pallet} truck={truck} />
      )}

      {/* Outer wireframe of the pallet stack — edges only, fully transparent fill
          (depthWrite=false) so it never causes alpha-sort flicker. */}
      {stackHeight > 0 && (
        <group position={stackCenter}>
          <mesh>
            <boxGeometry args={[stackLength, stackHeightUnit, stackWidth]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            <Edges color={pallet.color} linewidth={edgeWidth} />
          </mesh>

          {hatchLines.map((segment, i) => (
            <Line
              key={`hatch-${i}`}
              points={segment}
              color={pallet.color}
              lineWidth={0.5}
              transparent
              opacity={isHovered ? 0.85 : 0.6}
              dashed
              dashSize={0.05}
              gapSize={0.04}
            />
          ))}
        </group>
      )}
    </group>
  );
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
