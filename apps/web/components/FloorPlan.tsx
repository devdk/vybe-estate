import { layoutPlan, roomArea, type Room } from "@vybe/core";
import clsx from "clsx";

/** Schematic plan drawn from listed room sizes: the 2D fallback for "walk the unit". */
export function FloorPlan({ rooms, title, compact = false, className }: { rooms: Room[]; title: string; compact?: boolean; className?: string }) {
  const plan = layoutPlan(rooms);
  const pad = compact ? 0 : 2;
  const label = `${title}: ${rooms.map((r) => `${r.name} ${r.widthFt} by ${r.lengthFt} feet`).join(", ")}`;
  return (
    <svg
      viewBox={`${-pad} ${-pad} ${plan.width + pad * 2} ${plan.height + pad * 2}`}
      className={clsx("block h-auto w-full", className)}
      role="img"
      aria-label={label}
      data-testid="floor-plan"
    >
      {plan.rooms.map((r) => (
        <g key={r.name}>
          <rect
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            className={clsx(r.balcony ? "fill-accent-soft" : "fill-raised", "stroke-ink")}
            strokeWidth={compact ? 0.5 : 0.35}
            vectorEffect={compact ? "non-scaling-stroke" : undefined}
          />
          {!compact && r.w > 6 && r.h > 4 && (
            <text x={r.x + r.w / 2} y={r.y + r.h / 2} textAnchor="middle" className="fill-ink" style={{ fontSize: Math.min(1.5, r.w / 7) }}>
              <tspan x={r.x + r.w / 2} dy="-0.3em" fontWeight={600}>
                {r.name}
              </tspan>
              <tspan x={r.x + r.w / 2} dy="1.25em" className="fill-muted">
                {r.widthFt}′ × {r.lengthFt}′
              </tspan>
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

export function RoomTable({ rooms }: { rooms: Room[] }) {
  return (
    <table className="w-full text-[13.5px]">
      <caption className="sr-only">Room sizes</caption>
      <thead>
        <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-muted">
          <th className="py-1.5 font-medium">Room</th>
          <th className="py-1.5 font-medium">Size</th>
          <th className="py-1.5 text-right font-medium">Area</th>
        </tr>
      </thead>
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
  );
}
