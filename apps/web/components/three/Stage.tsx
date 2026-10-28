"use client";

import { AdaptiveDpr } from "@react-three/drei";
import { Canvas, useFrame, useThree, type CameraProps } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import * as THREE from "three";

/**
 * The one WebGL canvas a page may have. Renders on demand, pauses while
 * scrolled off-screen, and lowers resolution when frames get slow.
 */
export function Stage({ camera, onReady, onMiss, overlay, children }: { camera: CameraProps; onReady?: () => void; onMiss?: () => void; overlay?: ReactNode; children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={host} className="absolute inset-0 z-[1]" aria-hidden>
      <Canvas
        frameloop={visible ? "demand" : "never"}
        shadows
        dpr={[1, 1.75]}
        camera={camera}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={() => onReady?.()}
        onPointerMissed={() => onMiss?.()}
        style={{ touchAction: "pan-y" }}
      >
        <AdaptiveDpr pixelated />
        {children}
      </Canvas>
      {overlay}
    </div>
  );
}

export function StageLights({ span = 10 }: { span?: number }) {
  return (
    <>
      <hemisphereLight args={["white", "slategray", 1.5]} />
      <directionalLight
        position={[6, 12, 8]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
        shadow-camera-left={-span}
        shadow-camera-right={span}
        shadow-camera-top={span}
        shadow-camera-bottom={-span}
        shadow-camera-far={60}
      />
      <directionalLight position={[-6, 4, -3]} intensity={0.5} />
    </>
  );
}

export type LabelEls = RefObject<Map<string, HTMLElement>>;

/** Callback ref that registers a label element under an id. */
export const labelRef = (els: LabelEls, id: string) => (el: HTMLElement | null) => {
  if (el) els.current.set(id, el);
  else els.current.delete(id);
};

/**
 * Pins plain DOM labels to 3D points. Runs only on frames the scene renders,
 * which is exactly when the camera or objects have moved.
 */
export function LabelTracker({ anchors, els }: { anchors: { id: string; pos: THREE.Vector3 }[]; els: LabelEls }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    for (const a of anchors) {
      const el = els.current.get(a.id);
      if (!el) continue;
      v.copy(a.pos).project(camera);
      el.style.transform = `translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px) translate(-50%, -100%)`;
      el.style.opacity = v.z < 1 ? "1" : "0";
    }
  });
  return null;
}
