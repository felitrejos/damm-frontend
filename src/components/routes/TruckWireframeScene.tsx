"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Edges,
  Line,
  OrbitControls,
  PerspectiveCamera,
  Text,
} from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import type {
  DimensionsCm,
  PositionCm,
  TruckVisualization,
  VizPallet,
} from "./types";

const CM_TO_SCENE_UNIT = 0.018;
const PALLET_BASE_HEIGHT_CM = 15;
const COLOR_GRID_PRIMARY = "#78e7ff";
const COLOR_GRID_SECONDARY = "#1f3742";
const COLOR_CARGO_EDGE = "#e9fbff";
const COLOR_CABIN_EDGE = "#dff8ff";
const COLOR_PALLET_BASE = "#a98e6a";
const COLOR_FORWARD = "#9ef01a";
const COLOR_REAR = "#ff6b9a";

interface TruckWireframeSceneProps {
  visualization: TruckVisualization;
}

export function TruckWireframeScene({
  visualization,
}: TruckWireframeSceneProps) {
  return (
    <Canvas gl={{ antialias: true, alpha: false }} dpr={[1, 2]} shadows={false}>
      <color attach="background" args={["#050505"]} />
      <fog attach="fog" args={["#050505", 12, 28]} />
      <hemisphereLight args={["#bce7ff", "#0a0f14", 0.7]} />
      <pointLight position={[4, 7, 3]} intensity={1.4} color="#78e7ff" />
      <pointLight position={[-5, 3, -4]} intensity={0.9} color="#ff6b9a" />

      <AdaptiveCamera />
      <YardFloor />
      <AnimatedTruck visualization={visualization} />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minDistance={7}
        maxDistance={18}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.49}
        target={[0.2, 1.1, 0]}
      />
    </Canvas>
  );
}

function AdaptiveCamera() {
  const { size } = useThree();
  const isNarrow = size.width < 700;

  return (
    <PerspectiveCamera
      makeDefault
      position={isNarrow ? [10.6, 6.2, 16.4] : [8.6, 5.4, 12.2]}
      fov={isNarrow ? 52 : 42}
    />
  );
}

interface AnimatedTruckProps {
  visualization: TruckVisualization;
}

function AnimatedTruck({ visualization }: AnimatedTruckProps) {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.position.y =
      -1.25 + Math.sin(clock.elapsedTime * 0.5) * 0.02;
  });

  return (
    <group ref={groupRef} rotation={[0, -0.42, 0]} position={[0, -1.25, 0]}>
      <CargoBox dimensions={visualization.truck_dims} />
      <CargoFloor dimensions={visualization.truck_dims} />
      <CargoRibs dimensions={visualization.truck_dims} />
      <RearDoor dimensions={visualization.truck_dims} />
      <ForwardArrow dimensions={visualization.truck_dims} />
      <Cabin truckDimensions={visualization.truck_dims} />
      <Pallets
        pallets={visualization.pallets}
        truckDimensions={visualization.truck_dims}
      />
      <WheelSet truckDimensions={visualization.truck_dims} />
      <WheelArches dimensions={visualization.truck_dims} />
    </group>
  );
}

interface DimensionsProps {
  dimensions: DimensionsCm;
}

function CargoBox({ dimensions }: DimensionsProps) {
  const [length, height, width] = toSceneSize(dimensions);
  const center = toScenePosition(
    {
      x: dimensions.length_cm / 2,
      y: dimensions.width_cm / 2,
      z: dimensions.height_cm / 2,
    },
    dimensions
  );

  return (
    <group position={center}>
      <mesh>
        <boxGeometry args={[length, height, width]} />
        <meshBasicMaterial transparent opacity={0.03} color="#9adfff" />
        <Edges color={COLOR_CARGO_EDGE} linewidth={1.4} />
      </mesh>
    </group>
  );
}

function CargoFloor({ dimensions }: DimensionsProps) {
  const slotLengthCm = 120;
  const slotWidthCm = 80;
  const slotsLong = Math.floor(dimensions.length_cm / slotLengthCm);
  const slotsWide = Math.floor(dimensions.width_cm / slotWidthCm);
  const usedLength = slotsLong * slotLengthCm;
  const usedWidth = slotsWide * slotWidthCm;
  const offsetX = (dimensions.length_cm - usedLength) / 2;
  const offsetY = (dimensions.width_cm - usedWidth) / 2;

  const lines: Array<[PositionCm, PositionCm]> = [];

  for (let i = 0; i <= slotsLong; i += 1) {
    const x = offsetX + i * slotLengthCm;
    lines.push([
      { x, y: offsetY, z: 1 },
      { x, y: offsetY + usedWidth, z: 1 },
    ]);
  }

  for (let j = 0; j <= slotsWide; j += 1) {
    const y = offsetY + j * slotWidthCm;
    lines.push([
      { x: offsetX, y, z: 1 },
      { x: offsetX + usedLength, y, z: 1 },
    ]);
  }

  return (
    <group>
      {lines.map((segment, index) => (
        <Line
          key={index}
          points={[
            toScenePosition(segment[0], dimensions),
            toScenePosition(segment[1], dimensions),
          ]}
          color={COLOR_GRID_PRIMARY}
          lineWidth={0.6}
          transparent
          opacity={0.28}
        />
      ))}
    </group>
  );
}

function RearDoor({ dimensions }: DimensionsProps) {
  const xRear = dimensions.length_cm;
  const handleY = dimensions.width_cm / 2;
  const handleZ = dimensions.height_cm * 0.45;

  const verticalLines = [0.25, 0.5, 0.75].map((ratio) => ratio * dimensions.width_cm);

  return (
    <group>
      {verticalLines.map((y) => (
        <Line
          key={`door-${y}`}
          points={[
            toScenePosition({ x: xRear, y, z: 0 }, dimensions),
            toScenePosition({ x: xRear, y, z: dimensions.height_cm }, dimensions),
          ]}
          color={COLOR_REAR}
          lineWidth={0.6}
          transparent
          opacity={0.55}
        />
      ))}
      <mesh
        position={toScenePosition(
          { x: xRear, y: handleY, z: handleZ },
          dimensions
        )}
        rotation={[0, 0, Math.PI / 2]}
      >
        <torusGeometry args={[0.08, 0.012, 8, 24]} />
        <meshBasicMaterial color={COLOR_REAR} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

function ForwardArrow({ dimensions }: DimensionsProps) {
  const centerY = dimensions.width_cm / 2;
  const tipX = dimensions.length_cm * 0.18;
  const tailX = dimensions.length_cm * 0.04;
  const wing = 30;

  return (
    <group>
      <Line
        points={[
          toScenePosition({ x: tailX, y: centerY, z: 2 }, dimensions),
          toScenePosition({ x: tipX, y: centerY, z: 2 }, dimensions),
        ]}
        color={COLOR_FORWARD}
        lineWidth={1.2}
        transparent
        opacity={0.85}
      />
      <Line
        points={[
          toScenePosition({ x: tipX - wing, y: centerY - wing, z: 2 }, dimensions),
          toScenePosition({ x: tipX, y: centerY, z: 2 }, dimensions),
          toScenePosition({ x: tipX - wing, y: centerY + wing, z: 2 }, dimensions),
        ]}
        color={COLOR_FORWARD}
        lineWidth={1.2}
        transparent
        opacity={0.85}
      />
      <Text
        position={toScenePosition(
          { x: tipX + 36, y: centerY, z: 2 },
          dimensions
        )}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        fontSize={0.14}
        color={COLOR_FORWARD}
        anchorX="left"
        anchorY="middle"
      >
        FRONT
      </Text>
    </group>
  );
}

interface CabinProps {
  truckDimensions: DimensionsCm;
}

function Cabin({ truckDimensions }: CabinProps) {
  const cabinDimensions = {
    length_cm: 170,
    width_cm: truckDimensions.width_cm - 10,
    height_cm: 200,
  };
  const gap = 18;
  const [length, height, width] = toSceneSize(cabinDimensions);
  const center = toScenePosition(
    {
      x: -cabinDimensions.length_cm / 2 - gap,
      y: truckDimensions.width_cm / 2,
      z: cabinDimensions.height_cm / 2,
    },
    truckDimensions
  );

  return (
    <group position={center}>
      <mesh>
        <boxGeometry args={[length, height, width]} />
        <meshBasicMaterial transparent opacity={0.04} color="#ffffff" />
        <Edges color={COLOR_CABIN_EDGE} linewidth={1.1} />
      </mesh>

      <Line
        points={[
          [-length * 0.5, height * 0.05, -width * 0.5],
          [-length * 0.18, height * 0.05, -width * 0.5],
          [length * 0.5, height * 0.45, -width * 0.5],
          [length * 0.5, height * 0.45, width * 0.5],
          [-length * 0.18, height * 0.05, width * 0.5],
          [-length * 0.5, height * 0.05, width * 0.5],
        ]}
        color={COLOR_GRID_PRIMARY}
        lineWidth={1.0}
        transparent
        opacity={0.7}
      />

      <Line
        points={[
          [-length * 0.18, height * 0.05, -width * 0.5],
          [-length * 0.18, height * 0.05, width * 0.5],
        ]}
        color={COLOR_GRID_PRIMARY}
        lineWidth={0.8}
        transparent
        opacity={0.55}
      />

      {[-1, 1].map((side) => (
        <mesh
          key={`headlight-${side}`}
          position={[-length * 0.5, -height * 0.32, side * width * 0.36]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <torusGeometry args={[0.07, 0.01, 6, 18]} />
          <meshBasicMaterial color="#f7c948" transparent opacity={0.85} />
        </mesh>
      ))}

      {/* Front grille — short horizontal lines between the headlights */}
      {[-0.18, -0.27, -0.36].map((yRatio) => (
        <Line
          key={`grille-${yRatio}`}
          points={[
            [-length * 0.5, height * yRatio, -width * 0.28],
            [-length * 0.5, height * yRatio, width * 0.28],
          ]}
          color={COLOR_GRID_PRIMARY}
          lineWidth={0.6}
          transparent
          opacity={0.55}
        />
      ))}

      {/* Front bumper bar */}
      <mesh position={[-length * 0.52, -height * 0.46, 0]}>
        <boxGeometry args={[length * 0.06, height * 0.06, width * 0.94]} />
        <meshBasicMaterial color="#0a1014" />
        <Edges color={COLOR_CABIN_EDGE} linewidth={0.9} />
      </mesh>

      {/* Side mirrors — small mounted rectangles at window height */}
      {[-1, 1].map((side) => (
        <mesh
          key={`mirror-${side}`}
          position={[-length * 0.34, height * 0.18, side * (width * 0.55)]}
        >
          <boxGeometry args={[length * 0.05, height * 0.18, width * 0.04]} />
          <meshBasicMaterial color="#0a1014" />
          <Edges color={COLOR_CABIN_EDGE} linewidth={0.8} />
        </mesh>
      ))}
    </group>
  );
}

interface PalletsProps {
  pallets: VizPallet[];
  truckDimensions: DimensionsCm;
}

function Pallets({ pallets, truckDimensions }: PalletsProps) {
  return (
    <group>
      {pallets.map((pallet) => (
        <PalletWireframe
          key={pallet.pallet_id}
          pallet={pallet}
          truckDimensions={truckDimensions}
        />
      ))}
    </group>
  );
}

interface PalletWireframeProps {
  pallet: VizPallet;
  truckDimensions: DimensionsCm;
}

function PalletWireframe({ pallet, truckDimensions }: PalletWireframeProps) {
  const baseHeight = Math.min(PALLET_BASE_HEIGHT_CM, pallet.dims.height_cm);
  const stackHeight = Math.max(0, pallet.dims.height_cm - baseHeight);

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

  const baseCenter = toScenePosition(
    {
      x: pallet.position.x + pallet.dims.length_cm / 2,
      y: pallet.position.y + pallet.dims.width_cm / 2,
      z: pallet.position.z + baseHeight / 2,
    },
    truckDimensions
  );
  const stackCenter = toScenePosition(
    {
      x: pallet.position.x + pallet.dims.length_cm / 2,
      y: pallet.position.y + pallet.dims.width_cm / 2,
      z: pallet.position.z + baseHeight + stackHeight / 2,
    },
    truckDimensions
  );

  const isReturn = pallet.is_return;

  return (
    <group>
      <group position={baseCenter}>
        <mesh>
          <boxGeometry args={[baseLength, baseHeightUnit, baseWidth]} />
          <meshBasicMaterial
            transparent
            opacity={0.12}
            color={COLOR_PALLET_BASE}
          />
          <Edges color={COLOR_PALLET_BASE} linewidth={1.0} />
        </mesh>
      </group>

      {stackHeight > 0 && (
        <group position={stackCenter}>
          <mesh>
            <boxGeometry args={[stackLength, stackHeightUnit, stackWidth]} />
            <meshBasicMaterial
              transparent
              opacity={isReturn ? 0.05 : 0.08}
              color={pallet.color}
            />
            <Edges color={pallet.color} linewidth={1.4} />
          </mesh>

          {isReturn && (
            <Line
              points={[
                [-stackLength / 2, -stackHeightUnit / 2, -stackWidth / 2],
                [stackLength / 2, stackHeightUnit / 2, stackWidth / 2],
              ]}
              color={pallet.color}
              lineWidth={0.7}
              transparent
              opacity={0.6}
              dashed
              dashSize={0.06}
              gapSize={0.04}
            />
          )}

          <Text
            position={[0, stackHeightUnit / 2 + 0.05, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.13}
            color="#f9fdff"
            anchorX="center"
            anchorY="middle"
          >
            {pallet.label}
          </Text>
        </group>
      )}
    </group>
  );
}

interface WheelSetProps {
  truckDimensions: DimensionsCm;
}

function WheelSet({ truckDimensions }: WheelSetProps) {
  // Realistic 6/8-pal rigid truck: 1 cab axle + tandem rear axles.
  const axlePositions = [
    -90,
    truckDimensions.length_cm * 0.62,
    truckDimensions.length_cm * 0.78,
  ];
  const sideY = [-14, truckDimensions.width_cm + 14];
  const wheelRadiusCm = 40;

  return (
    <group>
      {axlePositions.flatMap((x) =>
        sideY.map((y) => {
          const position = toScenePosition(
            { x, y, z: wheelRadiusCm },
            truckDimensions
          );
          return (
            <Wheel
              key={`${x}-${y}`}
              position={position}
              radius={wheelRadiusCm * CM_TO_SCENE_UNIT}
            />
          );
        })
      )}
    </group>
  );
}

interface WheelProps {
  position: [number, number, number];
  radius: number;
}

function Wheel({ position, radius }: WheelProps) {
  const tubeRadius = radius * 0.22;
  const hubRadius = radius * 0.38;
  const hubDepth = tubeRadius * 1.6;
  const spokeCount = 5;
  const spokeInner = hubRadius * 0.55;
  const spokeOuter = radius - tubeRadius * 0.4;

  const spokes = useMemo(
    () =>
      Array.from({ length: spokeCount }, (_, i) => {
        const angle = (i / spokeCount) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [
          [cos * spokeInner, sin * spokeInner, 0] as [number, number, number],
          [cos * spokeOuter, sin * spokeOuter, 0] as [number, number, number],
        ];
      }),
    [spokeInner, spokeOuter]
  );

  return (
    <group position={position}>
      {/* Tire body — torus default lies in XY plane, hole-axis along Z (lateral) */}
      <mesh>
        <torusGeometry args={[radius, tubeRadius, 14, 64]} />
        <meshBasicMaterial color="#0a1014" />
        <Edges color="#dff8ff" linewidth={1.4} />
      </mesh>

      {/* Inner rim ring */}
      <mesh>
        <torusGeometry args={[hubRadius, tubeRadius * 0.32, 10, 40]} />
        <meshBasicMaterial color="#9adfff" transparent opacity={0.85} />
      </mesh>

      {/* Hub cap (short cylinder along Z gives the wheel depth) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[hubRadius * 0.45, hubRadius * 0.45, hubDepth, 20]} />
        <meshBasicMaterial color="#0a1014" />
        <Edges color={COLOR_GRID_PRIMARY} linewidth={1.0} />
      </mesh>

      {/* Spokes */}
      {spokes.map((segment, i) => (
        <Line
          key={`spoke-${i}`}
          points={segment}
          color={COLOR_GRID_PRIMARY}
          lineWidth={0.9}
          transparent
          opacity={0.78}
        />
      ))}
    </group>
  );
}

function CargoRibs({ dimensions }: DimensionsProps) {
  // Horizontal panel ribs along the cargo body sides — adds detail without
  // hiding the load. Drawn on the inside face of each side wall at three
  // heights spaced through the cargo height.
  const ribHeights = [0.32, 0.55, 0.78].map((r) => r * dimensions.height_cm);
  const sides = [0, dimensions.width_cm];

  return (
    <group>
      {sides.flatMap((y) =>
        ribHeights.map((z) => (
          <Line
            key={`rib-${y}-${z}`}
            points={[
              toScenePosition({ x: 0, y, z }, dimensions),
              toScenePosition({ x: dimensions.length_cm, y, z }, dimensions),
            ]}
            color={COLOR_CARGO_EDGE}
            lineWidth={0.4}
            transparent
            opacity={0.22}
          />
        )),
      )}
    </group>
  );
}

function WheelArches({ dimensions }: DimensionsProps) {
  // Half-circle arches on the cargo body sides above the rear wheels.
  // Mirrors the WheelSet rear axle X positions so they always line up.
  const archCenters = [
    dimensions.length_cm * 0.62,
    dimensions.length_cm * 0.78,
  ];
  const archRadiusCm = 64;
  const archHeightCm = archRadiusCm;
  const segments = 18;
  const sides = [0, dimensions.width_cm];

  const arcPoints = (centerX: number, y: number) =>
    Array.from({ length: segments + 1 }, (_, i) => {
      const t = (i / segments) * Math.PI;
      const x = centerX - Math.cos(t) * archRadiusCm;
      const z = Math.sin(t) * archHeightCm;
      return toScenePosition({ x, y, z }, dimensions);
    });

  return (
    <group>
      {sides.flatMap((y) =>
        archCenters.map((cx) => (
          <Line
            key={`arch-${y}-${cx}`}
            points={arcPoints(cx, y)}
            color={COLOR_CARGO_EDGE}
            lineWidth={0.7}
            transparent
            opacity={0.55}
          />
        )),
      )}
    </group>
  );
}

function YardFloor() {
  const radius = 9;
  const ringCount = 5;
  const radialCount = 24;

  const rings = useMemo(() => {
    return Array.from({ length: ringCount }, (_, ringIndex) => {
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
    });
  }, []);

  const radials = useMemo(() => {
    return Array.from({ length: radialCount }, (_, index) => {
      const angle = (index / radialCount) * Math.PI * 2;
      return [
        [0, 0, 0] as [number, number, number],
        [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [
          number,
          number,
          number
        ],
      ];
    });
  }, []);

  return (
    <group position={[0, -1.27, 0]}>
      {rings.map((ringPoints, index) => (
        <Line
          key={`ring-${index}`}
          points={ringPoints}
          color={index === ringCount - 1 ? COLOR_GRID_PRIMARY : COLOR_GRID_SECONDARY}
          lineWidth={index === ringCount - 1 ? 0.6 : 0.4}
          transparent
          opacity={index === ringCount - 1 ? 0.45 : 0.32}
        />
      ))}
      {radials.map((segment, index) => (
        <Line
          key={`radial-${index}`}
          points={segment}
          color={COLOR_GRID_SECONDARY}
          lineWidth={0.35}
          transparent
          opacity={0.22}
        />
      ))}
    </group>
  );
}

function toSceneSize(dimensions: DimensionsCm): [number, number, number] {
  return [
    dimensions.length_cm * CM_TO_SCENE_UNIT,
    dimensions.height_cm * CM_TO_SCENE_UNIT,
    dimensions.width_cm * CM_TO_SCENE_UNIT,
  ];
}

function toScenePosition(
  position: PositionCm,
  truckDimensions: DimensionsCm
): [number, number, number] {
  return [
    (position.x - truckDimensions.length_cm / 2) * CM_TO_SCENE_UNIT,
    position.z * CM_TO_SCENE_UNIT,
    (position.y - truckDimensions.width_cm / 2) * CM_TO_SCENE_UNIT,
  ];
}
