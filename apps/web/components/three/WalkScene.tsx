"use client";

import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { FACING_BEARING, type Facing, type PlacedRoom, type SunPosition } from "@vybe/core";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Tokens } from "@/lib/device";
import { LabelTracker, Stage, labelRef } from "./Stage";

export interface WalkSceneProps {
  rooms: PlacedRoom[];
  width: number;
  height: number;
  facing: Facing;
  sun: SunPosition;
  view: "dollhouse" | "top";
  tokens: Tokens;
  onReady: () => void;
}

const FT = 0.1;
const WALL_H = 9.5 * FT;
const WALL_T = 0.35 * FT;
const RAD = Math.PI / 180;

/** Walls along each room's edges; shared edges overlap, which is invisible at this scale. */
function Room({ r, ox, oz, tokens }: { r: PlacedRoom; ox: number; oz: number; tokens: Tokens }) {
  const x = ox + (r.x + r.w / 2) * FT;
  const z = oz + (r.y + r.h / 2) * FT;
  const w = r.w * FT;
  const d = r.h * FT;
  const wall = (px: number, pz: number, sx: number, sz: number, key: string) => (
    <mesh key={key} position={[px, WALL_H / 2, pz]} castShadow receiveShadow>
      <boxGeometry args={[sx, WALL_H, sz]} />
      <meshStandardMaterial color={tokens.raised} roughness={0.8} />
    </mesh>
  );
  return (
    <group>
      <mesh position={[x, 0.01, z]} receiveShadow>
        <boxGeometry args={[w, 0.02, d]} />
        <meshStandardMaterial color={r.balcony ? tokens.pedestal : tokens.line} roughness={0.9} />
      </mesh>
      {!r.balcony && [
        wall(x, z - d / 2, w, WALL_T, "n"),
        wall(x, z + d / 2, w, WALL_T, "s"),
        wall(x - w / 2, z, WALL_T, d, "w"),
        wall(x + w / 2, z, WALL_T, d, "e"),
      ]}
      {r.balcony && (
        <mesh position={[x, 0.18, z - d / 2]} castShadow>
          <boxGeometry args={[w, 0.36, WALL_T]} />
          <meshStandardMaterial color={tokens.raised} roughness={0.8} />
        </mesh>
      )}
    </group>
  );
}

function FitView({ size, view }: { size: number; view: WalkSceneProps["view"] }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const viewport = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    const v = THREE.MathUtils.degToRad(camera.fov);
    const h = 2 * Math.atan(Math.tan(v / 2) * (viewport.width / Math.max(1, viewport.height)));
    const dist = (size * 0.62) / Math.sin(Math.min(v, h) / 2);
    const dir = view === "top" ? new THREE.Vector3(0, 1, 0.001) : new THREE.Vector3(0.55, 0.9, 0.85).normalize();
    camera.position.copy(dir.multiplyScalar(dist));
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
    invalidate();
  }, [camera, viewport.width, viewport.height, size, view, controls, invalidate]);
  return null;
}

export default function WalkScene({ rooms, width, height, facing, sun, view, tokens, onReady }: WalkSceneProps) {
  const ox = (-width / 2) * FT;
  const oz = (-height / 2) * FT;
  const size = Math.hypot(width, height) * FT;
  // The plan's top edge is the side the flat faces; turn the whole flat to that compass bearing.
  const turn = -FACING_BEARING[facing] * RAD;
  const up = sun.altitude > 0;
  const sunDir = new THREE.Vector3(Math.cos(sun.altitude * RAD) * Math.sin(sun.bearing * RAD), Math.sin(Math.max(sun.altitude, 2) * RAD), -Math.cos(sun.altitude * RAD) * Math.cos(sun.bearing * RAD)).normalize();
  const labels = useRef(new Map<string, HTMLElement>());
  // Label the rooms you'd walk into; small ones (bathrooms, utility) are in the room table.
  const labelled = useMemo(() => rooms.filter((r) => !r.balcony && r.areaSqft >= 70), [rooms]);
  const anchors = useMemo(() => {
    const m = new THREE.Matrix4().makeRotationY(turn);
    return labelled.map((r) => ({ id: r.name, pos: new THREE.Vector3(ox + (r.x + r.w / 2) * FT, WALL_H + 0.05, oz + (r.y + r.h / 2) * FT).applyMatrix4(m) }));
  }, [labelled, turn, ox, oz]);

  return (
    <Stage
      camera={{ position: [3, 5, 5], fov: 35 }}
      onReady={onReady}
      overlay={
        <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
          {labelled.map((r) => (
            <span key={r.name} ref={labelRef(labels, r.name)} className="absolute left-0 top-0 whitespace-nowrap rounded-md bg-raised/90 px-1.5 py-0.5 text-[11px] font-semibold text-ink opacity-0">
              {r.name}
            </span>
          ))}
        </div>
      }
    >
      <hemisphereLight args={["white", "slategray", up ? 1.2 : 0.6]} />
      <directionalLight
        position={sunDir.clone().multiplyScalar(size * 2).toArray()}
        intensity={up ? 2.6 : 0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-size}
        shadow-camera-right={size}
        shadow-camera-top={size}
        shadow-camera-bottom={-size}
        shadow-camera-far={size * 5}
      />
      <mesh position={[0, -0.03, 0]} receiveShadow>
        <cylinderGeometry args={[size * 0.75, size * 0.77, 0.04, 96]} />
        <meshStandardMaterial color={tokens.pedestal} roughness={0.95} />
      </mesh>
      {/* North marker: a real bearing, so buyers can read which way each room looks. */}
      <mesh position={[0, 0.01, -size * 0.68]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[size * 0.035, 3]} />
        <meshBasicMaterial color={tokens.accent} />
      </mesh>
      <group rotation={[0, turn, 0]}>
        {rooms.map((r) => (
          <Room key={r.name} r={r} ox={ox} oz={oz} tokens={tokens} />
        ))}
      </group>
      <LabelTracker anchors={anchors} els={labels} />
      <OrbitControls makeDefault enablePan={false} minPolarAngle={0} maxPolarAngle={1.3} />
      <FitView size={size} view={view} />
    </Stage>
  );
}
