"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Tokens } from "@/lib/device";
import type { District } from "@/lib/showroom-data";
import { CITY_RADIUS } from "@/lib/showroom-data";
import { LabelTracker, Stage, StageLights, labelRef } from "./Stage";

export interface CityWorldProps {
  districts: District[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
  tokens: Tokens;
  reducedMotion: boolean;
  onReady: () => void;
}

const MAX_DISTRICT_H = 2.1;
const FLOOR_H = 0.045;
const districtHeight = (h: number) => 0.25 + h * MAX_DISTRICT_H;
const tallestProject = (d: District) => Math.max(0, ...d.projects.map((p) => p.floors)) * FLOOR_H;
/** Exponential approach that settles in about the "fly" motion token (900 ms). */
const approach = (dt: number, reduced: boolean, rate = 5) => (reduced ? 1 : 1 - Math.exp(-dt * rate));

function DistrictMesh({ d, t, h, selected, hovered, setHovered, onSelect, tokens, reduced }: {
  d: District;
  t: number;
  h: number;
  selected: boolean;
  hovered: boolean;
  setHovered: (slug: string | null) => void;
  onSelect: (slug: string) => void;
  tokens: Tokens;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const anim = useRef({ grow: reduced ? 1 : 0, lift: 0 });
  const invalidate = useThree((s) => s.invalidate);
  const height = districtHeight(h);
  const color = useMemo(() => new THREE.Color(tokens.navy).lerp(new THREE.Color(tokens.accent), t), [tokens, t]);

  useEffect(() => invalidate(), [selected, hovered, invalidate]);
  useFrame((_, dt) => {
    const a = anim.current;
    const lift = selected || hovered ? 0.3 : 0;
    a.grow += (1 - a.grow) * approach(dt, reduced, 3.5);
    a.lift += (lift - a.lift) * approach(dt, reduced, 9);
    if (group.current) {
      group.current.scale.y = Math.max(0.001, a.grow);
      group.current.position.y = a.lift;
    }
    if (Math.abs(1 - a.grow) > 0.002 || Math.abs(lift - a.lift) > 0.002) invalidate();
  });

  return (
    <group position={[d.x, 0, -d.y]}>
      <group ref={group}>
        <mesh
          castShadow
          receiveShadow
          position={[0, height / 2, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(d.slug);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(d.slug);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(null);
            document.body.style.cursor = "";
          }}
        >
          <cylinderGeometry args={[d.radius, d.radius * 1.03, height, 6]} />
          <meshStandardMaterial color={color} roughness={0.55} emissive={color} emissiveIntensity={selected ? 0.35 : 0} />
        </mesh>
        {/* One block per real project, at its location and as tall as its tallest tower. */}
        {d.projects.map((p) => {
          const ph = Math.max(0.12, p.floors * FLOOR_H);
          return (
            <mesh key={p.slug} castShadow position={[p.dx, height + ph / 2, -p.dy]}>
              <boxGeometry args={[0.24, ph, 0.24]} />
              <meshStandardMaterial color={tokens.building} roughness={0.5} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/** Flies the orbit target to the chosen district and back out when cleared. */
function CameraRig({ focus, reduced }: { focus: THREE.Vector3 | null; reduced: boolean }) {
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const placed = useRef(false);
  const goal = useMemo(() => focus ?? new THREE.Vector3(0, 0.4, 0), [focus]);
  // Fit the whole pedestal in whichever field of view is narrower.
  const fit = useMemo(() => {
    const v = THREE.MathUtils.degToRad(camera.fov);
    const h = 2 * Math.atan(Math.tan(v / 2) * (size.width / Math.max(1, size.height)));
    return ((CITY_RADIUS + 1.8) / Math.tan(Math.min(v, h) / 2)) * 0.92;
  }, [camera.fov, size.width, size.height]);
  const distance = focus ? fit * 0.62 : fit;
  useEffect(() => invalidate(), [goal, distance, invalidate]);
  useFrame((_, dt) => {
    if (!controls) return;
    const k = placed.current ? approach(dt, reduced, 4.5) : 1;
    placed.current = true;
    controls.target.lerp(goal, k);
    const offset = camera.position.clone().sub(controls.target);
    const len = offset.length();
    offset.setLength(len + (distance - len) * k);
    camera.position.copy(controls.target).add(offset);
    controls.update();
    if (controls.target.distanceTo(goal) > 0.005 || Math.abs(len - distance) > 0.01) invalidate();
  });
  return null;
}

export default function CityWorld({ districts, selected, onSelect, tokens, reducedMotion, onReady }: CityWorldProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const psfs = districts.map((d) => d.medianPsfPaise);
  const [lo, hi] = [Math.min(...psfs), Math.max(...psfs)];
  const maxHomes = Math.max(...districts.map((d) => d.homes));
  const sel = districts.find((d) => d.slug === selected);
  const focus = useMemo(() => (sel ? new THREE.Vector3(sel.x, 0.6, -sel.y) : null), [sel]);
  const labels = useRef(new Map<string, HTMLElement>());
  const anchors = useMemo(
    () => districts.map((d) => ({ id: d.slug, pos: new THREE.Vector3(d.x, districtHeight(maxHomes ? d.homes / maxHomes : 0) + tallestProject(d) + 0.45, -d.y) })),
    [districts, maxHomes],
  );

  return (
    <Stage
      camera={{ position: [0, 9.5, 13.5], fov: 34 }}
      onReady={onReady}
      onMiss={() => onSelect(null)}
      overlay={
        <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
          {districts.map((d) => (
            <span
              key={d.slug}
              ref={labelRef(labels, d.slug)}
              className={
                "absolute left-0 top-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[12px] font-bold opacity-0 " +
                (d.slug === selected ? "border-ink bg-ink text-bg" : "border-line bg-raised text-ink")
              }
            >
              {d.name}
            </span>
          ))}
        </div>
      }
    >
      <StageLights span={CITY_RADIUS + 3} />
      <mesh receiveShadow position={[0, -0.2, 0]}>
        <cylinderGeometry args={[CITY_RADIUS + 1.6, CITY_RADIUS + 1.8, 0.4, 96]} />
        <meshStandardMaterial color={tokens.pedestal} roughness={0.95} />
      </mesh>
      {districts.map((d) => (
        <DistrictMesh
          key={d.slug}
          d={d}
          t={hi > lo ? (d.medianPsfPaise - lo) / (hi - lo) : 0.5}
          h={maxHomes ? d.homes / maxHomes : 0}
          selected={d.slug === selected}
          hovered={d.slug === hovered}
          setHovered={setHovered}
          onSelect={onSelect}
          tokens={tokens}
          reduced={reducedMotion}
        />
      ))}
      <OrbitControls makeDefault enablePan={false} enableZoom={false} minPolarAngle={0.35} maxPolarAngle={1.15} enableDamping={!reducedMotion} />
      <CameraRig focus={focus} reduced={reducedMotion} />
      <LabelTracker anchors={anchors} els={labels} />
    </Stage>
  );
}
