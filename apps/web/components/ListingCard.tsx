import { CATEGORIES, formatINR, formatINRRange, formatPossession, formatSqft, scarcityText, type SearchCard } from "@vybe/core";
import Link from "next/link";
import { FloorPlan } from "./FloorPlan";
import { PartnerLine } from "./ui";

const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

/** Mini elevation drawn from live unit status: one cell per flat. */
function TowersPreview({ towers }: { towers: Extract<SearchCard["preview"], { type: "towers" }>["towers"] }) {
  const cell = 4;
  const gap = 1;
  const maxFloors = Math.max(...towers.map((t) => t.floors));
  const widths = towers.map((t) => t.stacks * (cell + gap));
  const totalW = widths.reduce((a, b) => a + b, 0) + (towers.length - 1) * 8;
  const H = maxFloors * (cell + gap);
  let x = 0;
  return (
    <svg viewBox={`-6 -6 ${totalW + 12} ${H + 12}`} className="h-full w-full" preserveAspectRatio="xMidYMax meet" aria-hidden>
      {towers.map((t, ti) => {
        const ox = x;
        x += widths[ti]! + 8;
        return (
          <g key={t.name}>
            {[...t.statuses].map((s, i) => {
              const floor = Math.floor(i / t.stacks);
              const stack = i % t.stacks;
              return (
                <rect
                  key={i}
                  x={ox + stack * (cell + gap)}
                  y={H - (floor + 1) * (cell + gap)}
                  width={cell}
                  height={cell}
                  rx={0.6}
                  className={s === "a" ? "fill-avail" : s === "h" ? "fill-hold" : s === "b" ? "fill-booked" : "fill-sold"}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export function ListingCard({ card }: { card: SearchCard }) {
  const price = card.isRent ? `${formatINR(card.priceFromPaise, { compact: false })}/month` : formatINRRange(card.priceFromPaise, card.priceToPaise);
  const scarcity = card.kind === "project" && card.available !== undefined ? scarcityText(card.available) : null;
  const bhk = card.bhks.length > 1 ? `${card.bhks.join(", ")} BHK` : `${card.bhks[0]} BHK`;
  return (
    <article className="group relative grid gap-3 rounded-[22px] border border-line bg-raised p-3 transition-shadow duration-250 hover:shadow-[0_22px_40px_-28px_rgba(17,24,39,.5)]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[radial-gradient(90%_90%_at_50%_20%,var(--stage-a),var(--stage-b))] p-4">
        {card.preview.type === "towers" ? <TowersPreview towers={card.preview.towers} /> : <FloorPlan rooms={card.preview.rooms} title={card.title} compact className="mx-auto max-h-full w-auto" />}
        <span className="absolute left-2.5 top-2.5 rounded-full border border-line bg-raised px-2.5 py-0.5 text-[11px] font-bold">{categoryLabel(card.category)}</span>
        <span className="absolute bottom-2 right-3 font-mono text-[10px] text-muted">{card.preview.type === "towers" ? "Live unit status" : "Plan from listed sizes"}</span>
      </div>
      <div className="grid gap-0.5 px-1">
        <h3 className="text-[16.5px] font-bold leading-snug">
          <Link href={card.href} className="after:absolute after:inset-0 after:content-['']">
            {card.title}
          </Link>
        </h3>
        <p className="text-[13.5px] text-muted">{card.localityName}</p>
        <p className="mt-1 font-mono text-[17px] font-medium tabular" data-testid="price">
          {price}
        </p>
      </div>
      <ul className="flex flex-wrap gap-1.5 px-1 text-[12px]" aria-label="Key facts">
        <li className="rounded-lg bg-bg px-2 py-0.5">{bhk}</li>
        <li className="rounded-lg bg-bg px-2 py-0.5">{card.carpetMin === card.carpetMax ? formatSqft(card.carpetMin) : `${card.carpetMin}–${formatSqft(card.carpetMax)}`} carpet</li>
        <li className="rounded-lg bg-bg px-2 py-0.5">{formatPossession(card.possession)}</li>
        {card.floorLabel && <li className="rounded-lg bg-bg px-2 py-0.5">{card.floorLabel}</li>}
      </ul>
      <div className="grid gap-1 px-1 pb-1">
        <PartnerLine {...card.partner} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[10.5px] text-muted">{card.rera ? `RERA ${card.rera}` : "Not in a RERA project"}</span>
          {card.kind === "project" && (
            <span className="text-[12px] font-semibold text-avail-ink">
              {scarcity ?? `${card.available} of ${card.total} available`}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
