"use client";

import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Tokens } from "@/lib/device";
import type { ExplorerTower } from "@/lib/showroom-data";
import { LabelTracker, Stage, StageLights, labelRef } from "./Stage";

export interface TowerSceneProps {
  towers: ExplorerTower[];
  activeTowerId: string;
  selectedUnit: string | null;
  onPick: (towerId: string, unitNumber: string) => void;
  tokens: Tokens;
  onReady: () => void;
}

const W = 0.56;
const D = 0.5;
const H = 0.3;
const GAP = 0.07;
const FLOOR_GAP = 0.05;
const TOWER_GAP = 1.4;

/** Stacks wrap around the core: front row left→right, back row right→left. */
function stackPosition(stack: number, stacks: number) {
  const cols = Math.ceil(stacks / 2);
  const front = stack <= cols;
  const col = front ? stack - 1 : stacks - stack;
  return { x: (col - (cols - 1) / 2) * (W + GAP), z: front ? (D + GAP) / 2 : -(D + GAP) / 2 };
}

export const towerWidth = (t: ExplorerTower) => Math.ceil(t.stacks / 2) * (W + GAP);
const towerHeight = (t: ExplorerTower) => t.floors * (H + FLOOR_GAP);

/** Building geometry is generated from the inventory table: one box per flat, one draw call per tower. */
function TowerMesh({ tower, x, active, selectedUnit, onPick, tokens }: { tower: ExplorerTower; x: number; active: boolean; selectedUnit: string | null; onPick: TowerSceneProps["onPick"]; tokens: Tokens }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  const selectedFloor = active && selectedUnit ? tower.units.find((u) => u[0] === selectedUnit)?.[1] : undefined;

  const palette = useMemo(
    () => ({
      available: new THREE.Color(tokens.avail),
      on_hold: new THREE.Color(tokens.hold),
      booked: new THREE.Color(tokens.booked),
      sold: new THREE.Color(tokens.sold),
      accent: new THREE.Color(tokens.accent),
      dim: new THREE.Color(tokens.pedestal),
    }),
    [tokens],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    const firstColors = !mesh.instanceColor;
    tower.units.forEach(([number, floor, stack, status], i) => {
      const p = stackPosition(stack, tower.stacks);
      m.makeTranslation(p.x, (floor - 1) * (H + FLOOR_GAP) + H / 2, p.z);
      mesh.setMatrixAt(i, m);
      c.copy(palette[status]);
      if (number === selectedUnit) c.copy(palette.accent);
      else if (!active) c.lerp(palette.dim, 0.35);
      else if (selectedFloor !== undefined && floor !== selectedFloor) c.lerp(palette.dim, 0.55);
      mesh.setColorAt(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    // The shader needs recompiling once per-instance colours exist.
    if (firstColors) (mesh.material as THREE.Material).needsUpdate = true;
    mesh.computeBoundingSphere();
    invalidate();
  }, [tower, active, selectedUnit, selectedFloor, palette, invalidate]);

  return (
    <group position={[x, 0, 0]}>
      <instancedMesh
        ref={ref}
        args={[undefined, undefined, tower.units.length]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          const u = e.instanceId !== undefined ? tower.units[e.instanceId] : undefined;
          if (u) onPick(tower.id, u[0]);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial roughness={0.45} />
      </instancedMesh>
    </group>
  );
}

const VIEW_DIR = new THREE.Vector3(0.5, 0.32, 1).normalize();

/** Places the camera so the whole site (towers + pedestal) fits the canvas at any aspect ratio. */
function FitCamera({ radius, targetY }: { radius: number; targetY: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    const v = THREE.MathUtils.degToRad(camera.fov);
    const h = 2 * Math.atan(Math.tan(v / 2) * (size.width / Math.max(1, size.height)));
    const dist = radius / Math.sin(Math.min(v, h) / 2);
    camera.position.set(0, targetY, 0).addScaledVector(VIEW_DIR, dist);
    if (controls) {
      controls.target.set(0, targetY, 0);
      controls.minDistance = dist * 0.4;
      controls.maxDistance = dist * 1.4;
      controls.update();
    }
    invalidate();
  }, [camera, size.width, size.height, radius, targetY, controls, invalidate]);
  return null;
}

export default function TowerScene({ towers, activeTowerId, selectedUnit, onPick, tokens, onReady }: TowerSceneProps) {
  const widths = towers.map(towerWidth);
  const total = widths.reduce((a, b) => a + b, 0) + TOWER_GAP * (towers.length - 1);
  const xs = widths.map((w, i) => -total / 2 + widths.slice(0, i).reduce((a, b) => a + b + TOWER_GAP, 0) + w / 2);
  const maxH = Math.max(...towers.map(towerHeight));
  const span = Math.max(maxH, total);
  const pedestal = total / 2 + 2;
  const radius = Math.hypot(Math.max(pedestal, total / 2 + 0.5), maxH / 2 + 0.6);
  const labels = useRef(new Map<string, HTMLElement>());
  const anchors = useMemo(() => towers.map((t, i) => ({ id: t.id, pos: new THREE.Vector3(xs[i]!, towerHeight(t) + 0.45, 0) })), [towers]); // xs derives from towers

  return (
    <Stage
      camera={{ position: [0, maxH / 2, 40], fov: 32 }}
      onReady={onReady}
      overlay={
        <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
          {towers.map((t) => (
            <span
              key={t.id}
              ref={labelRef(labels, t.id)}
              className={"absolute left-0 top-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[12px] font-bold opacity-0 " + (t.id === activeTowerId ? "border-ink bg-ink text-bg" : "border-line bg-raised text-ink")}
            >
              {t.name}
            </span>
          ))}
        </div>
      }
    >
      <StageLights span={span} />
      <mesh receiveShadow position={[0, -0.12, 0]}>
        <cylinderGeometry args={[pedestal, pedestal + 0.1, 0.24, 96]} />
        <meshStandardMaterial color={tokens.pedestal} roughness={0.95} />
      </mesh>
      {towers.map((t, i) => (
        <TowerMesh key={t.id} tower={t} x={xs[i]!} active={t.id === activeTowerId} selectedUnit={selectedUnit} onPick={onPick} tokens={tokens} />
      ))}
      <LabelTracker anchors={anchors} els={labels} />
      <OrbitControls makeDefault enablePan={false} minPolarAngle={0.3} maxPolarAngle={1.45} />
      <FitCamera radius={radius} targetY={maxH / 2} />
    </Stage>
  );
}
