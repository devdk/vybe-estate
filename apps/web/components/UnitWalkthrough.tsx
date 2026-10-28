"use client";

import {
  FACING_BEARING,
  LOW_SUN_DEG,
  compassPoint,
  formatFacing,
  furnitureFit,
  istDate,
  layoutPlan,
  roomArea,
  sunPosition,
  sunlitSides,
  type Facing,
  type LngLat,
  type Room,
} from "@vybe/core";
import clsx from "clsx";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useLiteMode, useTokens } from "@/lib/device";
import { chip } from "./ui";

const WalkScene = dynamic(() => import("./three/WalkScene"), { ssr: false });

const COMPASS_NAME: Record<Facing, string> = { N: "north", NE: "north-east", E: "east", SE: "south-east", S: "south", SW: "south-west", W: "west", NW: "north-west" };
const PRESETS = [
  { label: "21 Mar", day: "2027-03-21", note: "equinox" },
  { label: "21 Jun", day: "2027-06-21", note: "longest day" },
  { label: "21 Sep", day: "2026-09-21", note: "equinox" },
  { label: "21 Dec", day: "2026-12-21", note: "shortest day" },
];
const hhmm = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
const isoToday = () => {
  const d = new Date(Date.now() + 5.5 * 3_600_000);
  return d.toISOString().slice(0, 10);
};

/** Sunrise and sunset to the minute, by scanning the day. */
function daylight(day: string, at: LngLat) {
  let rise: number | null = null;
  let set: number | null = null;
  let prev = sunPosition(istDate(day, 0), at).altitude;
  for (let m = 1; m <= 1440; m++) {
    const alt = sunPosition(istDate(day, m / 60), at).altitude;
    if (prev <= -0.833 && alt > -0.833) rise = m / 60;
    if (prev > -0.833 && alt <= -0.833) set = m / 60;
    prev = alt;
  }
  return { rise, set };
}

/** 2D plan with the sun's direction and the sunlit walls drawn relative to the flat. Also the Lite-mode view. */
function PlanSun({ plan, facing, sunBearing, sunUp, sides }: { plan: ReturnType<typeof layoutPlan>; facing: Facing; sunBearing: number; sunUp: boolean; sides: ReturnType<typeof sunlitSides> }) {
  const fs = Math.max(plan.width, plan.height) / 28;
  const cx = plan.width / 2;
  const cy = plan.height / 2;
  const ring = Math.hypot(plan.width, plan.height) / 2 + fs * 2.5;
  const half = ring + fs * 2;
  // On the drawing, "up" is the side the flat faces.
  const rel = ((sunBearing - FACING_BEARING[facing]) * Math.PI) / 180;
  const sx = cx + ring * Math.sin(rel);
  const sy = cy - ring * Math.cos(rel);
  const W = plan.width;
  const H = plan.height;
  const edges = { front: [0, 0, W, 0], right: [W, 0, W, H], back: [0, H, W, H], left: [0, 0, 0, H] } as const;
  const labelAt = { front: [cx, -fs * 1.2], right: [W + fs * 1.4, cy], back: [cx, H + fs * 1.9], left: [-fs * 1.4, cy] } as const;
  return (
    <svg viewBox={`${cx - half} ${cy - half} ${half * 2} ${half * 2}`} className="absolute inset-0 m-auto h-[90%] w-[90%]" aria-hidden>
      {plan.rooms.map((r) => (
        <g key={r.name}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} className={clsx(r.balcony ? "fill-accent-soft" : "fill-raised", "stroke-ink")} strokeWidth={fs * 0.1} />
          {r.w > r.name.length * fs * 0.55 && r.h > fs * 1.6 && (
            <text x={r.x + r.w / 2} y={r.y + r.h / 2} textAnchor="middle" dominantBaseline="middle" className="fill-ink" style={{ fontSize: fs * 0.85, fontWeight: 600 }}>
              {r.name}
            </text>
          )}
        </g>
      ))}
      {sides.map((sd) => {
        const [x1, y1, x2, y2] = edges[sd.side];
        const [lx, ly] = labelAt[sd.side];
        return (
          <g key={sd.side}>
            {sd.lit && <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-hold" strokeWidth={fs * 0.55} strokeLinecap="round" />}
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className={sd.faces === "N" ? "fill-accent-strong" : "fill-muted"} style={{ fontSize: fs * 0.95, fontWeight: 700 }}>
              {sd.side === "front" ? `Front · ${sd.faces}` : sd.faces}
            </text>
          </g>
        );
      })}
      {sunUp && (
        <g>
          <line x1={sx} y1={sy} x2={cx + (sx - cx) * 0.7} y2={cy + (sy - cy) * 0.7} className="stroke-hold" strokeWidth={fs * 0.22} strokeDasharray={`${fs * 0.6} ${fs * 0.4}`} />
          <circle cx={sx} cy={sy} r={fs} className="fill-hold" />
        </g>
      )}
    </svg>
  );
}

function FurnitureCheck({ rooms }: { rooms: Room[] }) {
  const usable = rooms.filter((r) => !r.balcony);
  const [roomName, setRoomName] = useState(usable.find((r) => /bedroom/i.test(r.name))?.name ?? usable[0]?.name ?? "");
  const [length, setLength] = useState(6.5);
  const [width, setWidth] = useState(6);
  const room = usable.find((r) => r.name === roomName);
  const fit = room && length > 0 && width > 0 ? furnitureFit(room, length, width) : null;
  const field = "rounded-lg border border-line bg-bg px-2.5 py-1.5 text-[14px] text-ink";
  return (
    <div className="grid gap-3">
      <h3 className="text-base font-bold">Will my furniture fit?</h3>
      <div className="grid grid-cols-3 gap-2">
        <label className="col-span-3 grid gap-1 text-[13px] text-muted">
          Room
          <select value={roomName} onChange={(e) => setRoomName(e.target.value)} className={field}>
            {usable.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name} ({r.widthFt}′ × {r.lengthFt}′)
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-[13px] text-muted">
          Length (ft)
          <input type="number" min={1} max={30} step={0.5} value={length} onChange={(e) => setLength(e.target.valueAsNumber)} className={clsx(field, "font-mono")} />
        </label>
        <label className="grid gap-1 text-[13px] text-muted">
          Width (ft)
          <input type="number" min={1} max={30} step={0.5} value={width} onChange={(e) => setWidth(e.target.valueAsNumber)} className={clsx(field, "font-mono")} />
        </label>
        <p className="self-end pb-1.5 text-[12px] text-muted">A king bed is about 6.5′ × 6′.</p>
      </div>
      {fit && (
        <p className={clsx("rounded-lg px-3 py-2 text-[13.5px]", fit.fits ? "bg-avail/12 text-avail-ink" : "bg-accent-soft text-accent-strong")} aria-live="polite">
          {fit.fits
            ? `Fits${fit.rotated ? " turned sideways" : ""}, leaving ${fit.spareLength.toFixed(1)} ft along the long wall and a ${(fit.spareWidth + 2).toFixed(1)} ft walkway.`
            : fit.spareLength < 0
              ? `Too long by ${Math.abs(fit.spareLength).toFixed(1)} ft for this room.`
              : `Fits the floor but leaves only ${(fit.spareWidth + 2).toFixed(1)} ft to walk past; 2 ft is comfortable.`}
        </p>
      )}
      <p className="text-[12px] text-muted">Door swings and window positions are not on the plan yet, so check those at the site visit.</p>
    </div>
  );
}

/** `facingLinks` lists the other orientations this plan is built in, as links (server-built hrefs). */
export function UnitWalkthrough({ rooms, facing, facingLinks, location }: { rooms: Room[]; facing: Facing; facingLinks?: { facing: Facing; href: string }[]; location: LngLat }) {
  const lite = useLiteMode();
  const tokens = useTokens();
  const plan = useMemo(() => layoutPlan(rooms), [rooms]);
  const [day, setDay] = useState(PRESETS[3]!.day);
  const [hour, setHour] = useState(15);
  const [view, setView] = useState<"dollhouse" | "top">("dollhouse");
  const [sceneReady, setSceneReady] = useState(false);
  useEffect(() => setDay(isoToday()), []);

  const sun = useMemo(() => sunPosition(istDate(day, hour), location), [day, hour, location]);
  const sides = useMemo(() => sunlitSides(facing, sun), [facing, sun]);
  const litSides = sides.filter((sd) => sd.lit).map((sd) => COMPASS_NAME[sd.faces]);
  const { rise, set } = useMemo(() => daylight(day, location), [day, location]);
  const show3d = !lite && tokens;
  const sunUp = sun.altitude > 0;
  const dayLabel = new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long" });

  return (
    <div className="grid gap-[18px] lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
      <div className="showroom h-[clamp(400px,46vw,560px)]">
        <div className={clsx("transition-opacity duration-250", show3d && sceneReady && "opacity-0")}>
          <PlanSun plan={plan} facing={facing} sunBearing={sun.bearing} sunUp={sunUp && sun.altitude >= LOW_SUN_DEG} sides={sides} />
        </div>
        {show3d && <WalkScene rooms={plan.rooms} width={plan.width} height={plan.height} facing={facing} sun={sun} view={view} tokens={tokens} onReady={() => setSceneReady(true)} />}
        <div className="pointer-events-none absolute inset-x-4 top-3.5 z-[3] flex justify-between font-mono text-[11.5px] uppercase tracking-[.1em] text-muted">
          <span>Walk the unit · real sun position</span>
          <span>{show3d && sceneReady ? "Drag to turn" : "Plan view"}</span>
        </div>
        {show3d && sceneReady && (
          <div className="absolute bottom-3.5 left-4 z-[3] flex gap-1.5" role="group" aria-label="Camera">
            {(["dollhouse", "top"] as const).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={clsx(chip(view === v), "!px-3 !py-1 !text-[12.5px]")}>
                {v === "dollhouse" ? "Dollhouse" : "From above"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid content-start gap-5 rounded-[22px] border border-line bg-raised p-4">
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Date">
            {PRESETS.map((p) => (
              <button key={p.day} type="button" aria-pressed={day === p.day} onClick={() => setDay(p.day)} className={clsx(chip(day === p.day), "!px-3 !py-1 !text-[12.5px]")} title={p.note}>
                {p.label}
              </button>
            ))}
            <label className="sr-only" htmlFor="walk-day">
              Any date
            </label>
            <input id="walk-day" type="date" value={day} onChange={(e) => e.target.value && setDay(e.target.value)} className="rounded-full border border-line bg-raised px-3 py-1 text-[12.5px]" />
          </div>
          <label className="grid gap-1.5">
            <span className="flex justify-between text-[13.5px]">
              <span>Time ({dayLabel})</span>
              <span className="font-mono tabular">{hhmm(hour)} IST</span>
            </span>
            <input type="range" min={6} max={19} step={0.25} value={hour} onChange={(e) => setHour(Number(e.target.value))} className="accent-[var(--accent)]" />
          </label>
          <div className="rounded-xl bg-bg p-3.5 text-[13.5px]" aria-live="polite">
            {sunUp ? (
              <p>
                Sun in the <b>{COMPASS_NAME[compassPoint(sun.bearing)]}</b>, <span className="font-mono">{Math.round(sun.altitude)}°</span> above the horizon.
              </p>
            ) : (
              <p>The sun is below the horizon.</p>
            )}
            <p className="mt-1 text-muted">
              {litSides.length
                ? `Direct sun on the ${litSides.join(" and ")} ${litSides.length === 1 ? "wall" : "walls"} of the flat.`
                : sunUp
                  ? "The sun is too low to reach the flat over nearby buildings."
                  : "No direct sun."}
            </p>
            <p className="mt-1 font-mono text-[12px] text-muted">
              Sunrise {rise !== null ? hhmm(rise) : "n/a"} · sunset {set !== null ? hhmm(set) : "n/a"}
            </p>
          </div>
          {facingLinks && facingLinks.length > 1 ? (
            <p className="text-[13px] text-muted">
              This plan is built facing {facingLinks.length} ways:{" "}
              {facingLinks.map((l, i) => (
                <span key={l.facing}>
                  {i > 0 && ", "}
                  {l.facing === facing ? (
                    <b className="text-ink">{COMPASS_NAME[l.facing]}</b>
                  ) : (
                    <a href={l.href} className="font-semibold text-accent-strong">
                      {COMPASS_NAME[l.facing]}
                    </a>
                  )}
                </span>
              ))}
              . The top of the plan is the front.
            </p>
          ) : (
            <p className="text-[13px] text-muted">{formatFacing(facing)} (the top of the plan).</p>
          )}
        </div>

        <table className="w-full text-[13.5px]">
          <caption className="mb-1 text-left text-base font-bold text-ink">Rooms</caption>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.name} className="border-t border-line">
                <td className="py-1.5">
                  {r.name}
                  {r.balcony && <span className="text-muted"> (not in carpet area)</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 font-mono tabular">
                  {r.widthFt}′ × {r.lengthFt}′
                </td>
                <td className="whitespace-nowrap py-1.5 text-right font-mono tabular">{Math.round(roomArea(r))} sq ft</td>
              </tr>
            ))}
          </tbody>
        </table>

        <FurnitureCheck rooms={rooms} />
      </div>
    </div>
  );
}
