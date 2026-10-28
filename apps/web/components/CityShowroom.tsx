"use client";

import { formatINR } from "@vybe/core";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { useLiteMode, useReducedMotion, useTokens } from "@/lib/device";
import { CITY_RADIUS, type District } from "@/lib/showroom-data";
import { btn } from "./ui";

const CityWorld = dynamic(() => import("./three/CityWorld"), { ssr: false });

const hexPoints = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");

/** Price ramp shared by the 2D map, the legend and the 3D districts. */
const rampFill = (t: number) => `color-mix(in oklab, var(--accent) ${Math.round(t * 100)}%, var(--navy))`;

/**
 * City world: a 2D map of the districts renders first (and is the whole
 * experience in Lite mode); the 3D scene replaces it once loaded.
 */
export function CityShowroom({ cityId, cityName, districts, className = "h-[clamp(420px,44vw,580px)]" }: { cityId: string; cityName: string; districts: District[]; className?: string }) {
  const lite = useLiteMode();
  const reduced = useReducedMotion();
  const tokens = useTokens();
  const [selected, setSelected] = useState<string | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const psfs = districts.map((d) => d.medianPsfPaise);
  const [lo, hi] = [Math.min(...psfs), Math.max(...psfs)];
  const ramp = (d: District) => (hi > lo ? (d.medianPsfPaise - lo) / (hi - lo) : 0.5);
  const sel = districts.find((d) => d.slug === selected);
  const show3d = !lite && tokens;
  const R = CITY_RADIUS + 1.6;

  return (
    <div className={`showroom ${className}`}>
      <svg
        viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`}
        className={`absolute inset-0 m-auto h-[86%] w-[86%] transition-opacity duration-250 ${show3d && sceneReady ? "opacity-0" : "opacity-100"}`}
        aria-hidden
      >
        <circle r={R} className="fill-[var(--pedestal)] stroke-line" strokeWidth={0.04} />
        {districts.map((d) => (
          <polygon
            key={d.slug}
            points={hexPoints(d.x, -d.y, d.radius)}
            style={{ fill: rampFill(ramp(d)) }}
            className={d.slug === selected ? "stroke-ink" : "stroke-transparent"}
            strokeWidth={0.12}
          />
        ))}
      </svg>

      {/* District buttons: the accessible way to pick a locality in both 2D and 3D. */}
      <ul className={`absolute inset-0 m-auto h-[86%] w-[86%] ${show3d && sceneReady ? "sr-only" : ""}`} aria-label={`Localities in ${cityName}`}>
        {districts.map((d) => (
          <li key={d.slug} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${((d.x + R) / (2 * R)) * 100}%`, top: `${((-d.y + R) / (2 * R)) * 100}%` }}>
            <button
              type="button"
              onClick={() => setSelected(d.slug === selected ? null : d.slug)}
              aria-pressed={d.slug === selected}
              className="whitespace-nowrap rounded-full border border-line bg-raised px-2.5 py-0.5 text-[12px] font-bold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-bg"
            >
              {d.name}
              <span className="sr-only">
                , {d.homes} homes, {formatINR(d.medianPsfPaise, { compact: false })} per sq ft
              </span>
            </button>
          </li>
        ))}
      </ul>

      {show3d && <CityWorld districts={districts} selected={selected} onSelect={setSelected} tokens={tokens} reducedMotion={reduced} onReady={() => setSceneReady(true)} />}

      <div className="pointer-events-none absolute inset-x-4 top-3.5 z-[3] flex justify-between font-mono text-[11.5px] uppercase tracking-[.1em] text-muted">
        <span>City showroom · {cityName}</span>
        <span>{show3d && sceneReady ? "Drag to turn" : "Map view"}</span>
      </div>

      <div className="absolute bottom-4 right-4 z-[3] hidden gap-1.5 rounded-xl border border-line bg-raised px-3 py-2.5 text-[11.5px] text-muted sm:grid">
        <span>Median ₹ per sq ft (carpet)</span>
        <span className="h-2 w-32 rounded" style={{ background: `linear-gradient(90deg, ${rampFill(0)}, ${rampFill(1)})` }} />
        <span className="flex justify-between font-mono text-[10.5px]">
          <span>{formatINR(lo, { compact: false })}</span>
          <span>{formatINR(hi, { compact: false })}</span>
        </span>
        <span>Height = homes available</span>
      </div>

      {sel && (
        <div className="absolute bottom-4 left-4 right-4 z-[4] grid max-w-[340px] gap-1.5 rounded-2xl border border-line bg-raised p-4 shadow-[0_12px_30px_-18px_rgba(17,24,39,.35)]" aria-live="polite">
          <p className="font-mono text-[11px] uppercase tracking-[.12em] text-muted">{cityName}</p>
          <h3 className="text-xl font-bold">{sel.name}</h3>
          <dl className="flex flex-wrap gap-x-4 gap-y-1 text-[13.5px]">
            <div>
              <dt className="sr-only">Median price</dt>
              <dd>
                <b className="font-mono font-medium">{formatINR(sel.medianPsfPaise, { compact: false })}</b> <span className="text-muted">/ sq ft</span>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Homes available</dt>
              <dd>
                <b className="font-mono font-medium">{sel.homes}</b> <span className="text-muted">homes</span>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Vibe score</dt>
              <dd>
                <b className="font-mono font-medium">{sel.vibe.toFixed(1)}</b> <span className="text-muted">vibe score</span>
              </dd>
            </div>
          </dl>
          <div className="mt-1 flex flex-wrap gap-2">
            <Link href={`/${cityId}?locality=${sel.slug}#results`} className={`${btn.primary} ${btn.small}`}>
              See homes
            </Link>
            <Link href={`/${cityId}/${sel.slug}`} className={`${btn.ghost} ${btn.small}`}>
              Locality guide
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
