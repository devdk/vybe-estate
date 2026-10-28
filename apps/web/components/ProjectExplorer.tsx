"use client";

import { STATUS_LABEL, formatFacing, formatINR, formatSqft, ordinal, type CityId, type LngLat, type UnitStatus } from "@vybe/core";
import clsx from "clsx";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLiteMode, useTokens } from "@/lib/device";
import type { ExplorerTower, UnitTuple } from "@/lib/showroom-data";
import type { ShortlistItem } from "@/lib/store";
import { BookVisitButton, ShortlistButton } from "./ShortlistButton";
import { CubeIcon, StatusBadge, chip } from "./ui";

const TowerScene = dynamic(() => import("./three/TowerScene"), { ssr: false });

const CELL: Record<UnitStatus, string> = {
  available: "bg-avail text-on-status",
  on_hold: "bg-hold/30 text-hold-ink",
  booked: "bg-bg text-muted",
  sold: "bg-bg text-muted line-through",
};
const SWATCH: Record<UnitStatus, string> = { available: "bg-avail", on_hold: "bg-hold", booked: "bg-booked", sold: "bg-sold" };
const FILL: Record<UnitStatus, string> = { available: "fill-avail", on_hold: "fill-hold", booked: "fill-booked", sold: "fill-sold" };

interface Props {
  project: { slug: string; name: string; cityId: CityId; localityName: string; location: LngLat; developerName: string; maintenancePaisePerSqft: number };
  towers: ExplorerTower[];
  unitTypes: { name: string; carpetSqft: number }[];
  initialUnit?: string;
}

/** Front elevation drawn from the inventory: the 2D view of the tower explorer. */
function Elevation({ towers, activeTowerId, selected, onPick }: { towers: ExplorerTower[]; activeTowerId: string; selected: string | null; onPick: (t: string, n: string) => void }) {
  const c = 6;
  const g = 1.5;
  const maxF = Math.max(...towers.map((t) => t.floors));
  const widths = towers.map((t) => t.stacks * (c + g));
  let x = 0;
  return (
    <svg viewBox={`-10 -14 ${widths.reduce((a, b) => a + b, 0) + (towers.length - 1) * 14 + 20} ${maxF * (c + g) + 24}`} className="absolute inset-0 m-auto h-[82%] w-[88%]" aria-hidden>
      {towers.map((t, ti) => {
        const ox = x;
        x += widths[ti]! + 14;
        return (
          <g key={t.id} opacity={t.id === activeTowerId ? 1 : 0.55}>
            <text x={ox + widths[ti]! / 2} y={-5} textAnchor="middle" className="fill-ink" style={{ fontSize: 5, fontWeight: 700 }}>
              {t.name}
            </text>
            {t.units.map(([n, floor, stack, status]) => (
              <rect
                key={n}
                x={ox + (stack - 1) * (c + g)}
                y={(maxF - floor) * (c + g)}
                width={c}
                height={c}
                rx={1}
                className={clsx(FILL[status], "cursor-pointer", n === selected && "stroke-ink")}
                strokeWidth={n === selected ? 1.4 : 0}
                onClick={() => onPick(t.id, n)}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export function ProjectExplorer({ project, towers, unitTypes, initialUnit }: Props) {
  const lite = useLiteMode();
  const tokens = useTokens();
  const initialTower = towers.find((t) => t.units.some((u) => u[0] === initialUnit)) ?? towers[0]!;
  const [activeTowerId, setActiveTowerId] = useState(initialTower.id);
  const [selected, setSelected] = useState<string | null>(initialUnit && initialTower.units.some((u) => u[0] === initialUnit) ? initialUnit : null);
  const [sceneReady, setSceneReady] = useState(false);
  const grid = useRef<HTMLDivElement>(null);
  // A deep-linked flat (?unit=) should be visible in the grid, not 20 floors below.
  useEffect(() => {
    const box = grid.current;
    const cell = box?.querySelector('[aria-pressed="true"]');
    if (box && cell) box.scrollTop += cell.getBoundingClientRect().top - box.getBoundingClientRect().top - box.clientHeight / 2;
  }, []);
  const tower = towers.find((t) => t.id === activeTowerId)!;
  const unit: UnitTuple | undefined = tower.units.find((u) => u[0] === selected);
  const show3d = !lite && tokens;

  const pick = (towerId: string, number: string) => {
    setActiveTowerId(towerId);
    setSelected(number);
  };

  const floors = Array.from({ length: tower.floors }, (_, i) => tower.floors - i);
  const byFloor = new Map<number, UnitTuple[]>();
  for (const u of tower.units) byFloor.set(u[1], [...(byFloor.get(u[1]) ?? []), u]);

  const describe = ([n, floor, , status, ti, facing, rupees]: UnitTuple) =>
    `${n}, ${unitTypes[ti]!.name}, ${formatSqft(unitTypes[ti]!.carpetSqft)} carpet, ${ordinal(floor)} floor, ${formatFacing(facing)}, ${formatINR(rupees * 100)}, ${STATUS_LABEL[status]}`;

  const item = (u: UnitTuple): ShortlistItem => {
    const t = unitTypes[u[4]]!;
    return {
      key: `unit:${project.slug}:${u[0]}`,
      kind: "unit",
      title: `${u[0]} · ${project.name}`,
      subtitle: `${t.name} · ${formatSqft(t.carpetSqft)} · ${ordinal(u[1])} floor · ${project.localityName}`,
      href: `/projects/${project.slug}?unit=${encodeURIComponent(u[0])}#explorer`,
      pricePaise: u[6] * 100,
      isRent: false,
      partnerName: project.developerName,
      location: project.location,
      cityId: project.cityId,
    };
  };

  return (
    <div className="grid gap-[18px] lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
      <div className="showroom h-[clamp(420px,46vw,560px)]">
        <div className={clsx("transition-opacity duration-250", show3d && sceneReady && "opacity-0")}>
          <Elevation towers={towers} activeTowerId={activeTowerId} selected={selected} onPick={pick} />
        </div>
        {show3d && <TowerScene towers={towers} activeTowerId={activeTowerId} selectedUnit={selected} onPick={pick} tokens={tokens} onReady={() => setSceneReady(true)} />}
        <div className="pointer-events-none absolute inset-x-4 top-3.5 z-[3] flex justify-between font-mono text-[11.5px] uppercase tracking-[.1em] text-muted">
          <span>Project showroom · live unit status</span>
          <span>{show3d && sceneReady ? "Drag to turn · tap a flat" : "Front elevation"}</span>
        </div>
        <ul className="absolute bottom-3.5 left-4 z-[3] flex flex-wrap gap-3 text-[12px] text-muted" aria-label="Legend">
          {(["available", "on_hold", "booked", "sold"] as const).map((s) => (
            <li key={s} className="flex items-center gap-1.5">
              <i className={clsx("inline-block size-2.5 rounded-sm", SWATCH[s])} />
              {STATUS_LABEL[s]}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid min-w-0 content-start gap-4 rounded-[22px] border border-line bg-raised p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold">Pick a flat</h3>
          {towers.length > 1 && (
            <div className="flex gap-1.5" role="group" aria-label="Tower">
              {towers.map((t) => (
                <button key={t.id} type="button" aria-pressed={t.id === activeTowerId} onClick={() => setActiveTowerId(t.id)} className={clsx(chip(t.id === activeTowerId), "!px-3 !py-1 !text-[12.5px]")}>
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div ref={grid} className="max-h-[300px] overflow-auto rounded-xl border border-line">
          <table className="w-full border-separate border-spacing-1 text-[11px]">
            <caption className="sr-only">Flats in {tower.name}, by floor. Select a flat to see its details.</caption>
            <tbody>
              {floors.map((f) => (
                <tr key={f}>
                  <th scope="row" className="w-10 pr-1 text-right font-mono font-normal text-muted">
                    {tower.floors > 1 ? ordinal(f) : ""}
                  </th>
                  {(byFloor.get(f) ?? []).map((u) => (
                    <td key={u[0]}>
                      <button
                        type="button"
                        aria-label={describe(u)}
                        aria-pressed={u[0] === selected}
                        onClick={() => setSelected(u[0])}
                        className={clsx("h-6 w-full min-w-9 rounded font-mono text-[10.5px] font-medium", CELL[u[3]], u[0] === selected && "ring-2 ring-accent ring-offset-1 ring-offset-raised")}
                      >
                        {u[0].split("-")[1]}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {unit ? (
          <div className="grid gap-3" aria-live="polite">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-xl">{unit[0]}</p>
              <StatusBadge status={unit[3]} />
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13.5px]">
              <dt className="text-muted">Type</dt>
              <dd>{unitTypes[unit[4]]!.name}</dd>
              <dt className="text-muted">Carpet area</dt>
              <dd className="font-mono tabular">{formatSqft(unitTypes[unit[4]]!.carpetSqft)}</dd>
              <dt className="text-muted">Floor</dt>
              <dd>{tower.floors > 1 ? `${ordinal(unit[1])} of ${tower.floors}` : "Independent villa"}</dd>
              <dt className="text-muted">Facing</dt>
              <dd>{formatFacing(unit[5])}</dd>
              <dt className="text-muted">Maintenance</dt>
              <dd className="font-mono tabular">{formatINR(project.maintenancePaisePerSqft * unitTypes[unit[4]]!.carpetSqft, { compact: false })}/month</dd>
              <dt className="text-muted">Price</dt>
              <dd className="font-mono text-base font-medium tabular">{formatINR(unit[6] * 100)}</dd>
            </dl>
            <Link href={`/projects/${project.slug}/walk/${unit[4]}?unit=${encodeURIComponent(unit[0])}`} className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-accent-strong">
              <CubeIcon /> Walk this flat with the real sun
            </Link>
            {unit[3] === "available" ? (
              <div className="flex flex-wrap gap-2">
                <BookVisitButton item={item(unit)} />
                <ShortlistButton item={item(unit)} />
              </div>
            ) : (
              <p className="text-[13px] text-muted">
                {unit[3] === "on_hold" ? "Another buyer has paid a refundable token on this flat." : "This flat is no longer available."} Pick a green one to book a visit.
              </p>
            )}
          </div>
        ) : (
          <p className="text-[13.5px] text-muted">Select a flat in the grid or the 3D tower to see its price, size and facing.</p>
        )}
      </div>
    </div>
  );
}
