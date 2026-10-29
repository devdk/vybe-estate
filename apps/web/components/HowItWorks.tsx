import { COMPASS_NAME, VIBE_FACTORS, allUnits, compassPoint, formatBhk, formatINR, haversineKm, istDate, ordinal, planVisitDay, projectSummary, sunPosition, sunlitSides, type CityId, type VisitStop } from "@vybe/core";
import { getCity, getPartner, listListings, listProjects, localityStats } from "@vybe/core/catalog";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowIcon } from "./ui";

const CITY: CityId = "bengaluru";

/**
 * One project carried through all four steps, so every example is a page the
 * buyer can open: the best-scoring locality that has flats available, its
 * project with the most flats left, and that project's highest available flat.
 */
function example() {
  const stats = new Map(localityStats(CITY).map((s) => [s.locality.slug, s]));
  const { p, summary } = listProjects(CITY)
    .map((p) => ({ p, summary: projectSummary(p) }))
    .filter((x) => x.summary.available > 0)
    .sort((a, b) => stats.get(b.p.localitySlug)!.vibe - stats.get(a.p.localitySlug)!.vibe || b.summary.available - a.summary.available)[0]!;
  const loc = stats.get(p.localitySlug)!;
  const unit = allUnits(p)
    .filter((u) => u.status === "available")
    .sort((a, b) => b.floor - a.floor)[0]!;
  const typeIndex = p.unitTypes.findIndex((t) => t.id === unit.unitTypeId);

  const sun = sunPosition(istDate(`${new Date().getFullYear()}-12-21`, 9), p.location);
  const litWalls = sunlitSides(unit.facing, sun)
    .filter((s) => s.lit)
    .map((s) => COMPASS_NAME[s.faces]);

  const stop = (id: string, label: string, partnerId: string, location: VisitStop["location"]) => ({ id, label, partnerName: getPartner(partnerId)!.name, location });
  const nearby = [
    ...listProjects(CITY)
      .filter((o) => o.slug !== p.slug && projectSummary(o).available > 0)
      .map((o) => stop(o.slug, o.name, o.developerId, o.location)),
    ...listListings(CITY)
      .filter((l) => l.kind === "resale")
      .map((l) => stop(l.slug, `${formatBhk(l.bhk)} in ${l.buildingName}`, l.partnerId, l.location)),
  ]
    .sort((a, b) => haversineKm(p.location, a.location) - haversineKm(p.location, b.location))
    .slice(0, 2);
  const visits = planVisitDay([stop(p.slug, p.name, p.developerId, p.location), ...nearby]);

  return { p, summary, loc, unit, type: p.unitTypes[typeIndex]!, typeIndex, sun, litWalls, visits };
}

function Step({ n, title, children, example, link }: { n: number; title: string; children: ReactNode; example: ReactNode; link: { href: string; label: string } }) {
  return (
    <li className="flex flex-col gap-3 rounded-[22px] border border-line bg-raised p-5">
      <p className="font-mono text-[12px] text-muted">Step {n}</p>
      <h3 className="-mt-1.5 text-[17px] font-bold leading-snug">{title}</h3>
      <p className="text-[14px] text-muted">{children}</p>
      <div className="mt-auto rounded-xl border border-line bg-surface p-3.5 text-[13.5px]">{example}</div>
      <Link href={link.href} className="inline-flex items-center gap-1 text-[13.5px] font-bold text-accent-strong">
        {link.label} <ArrowIcon className="size-3.5" />
      </Link>
    </li>
  );
}

export function HowItWorks() {
  const { p, summary, loc, unit, type, typeIndex, sun, litWalls, visits } = example();
  const city = getCity(CITY)!;
  const priceListDate = new Date(p.priceList.effectiveFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return (
    <section className="pt-14" aria-labelledby="how-h">
      <h2 id="how-h" className="font-display text-[clamp(22px,3vw,30px)] font-bold tracking-tight">
        How buying on Vybe works
      </h2>
      <p className="mt-1 text-[13.5px] text-muted">
        Four steps, followed with one project in {city.name}: {p.name} in {loc.locality.name}.
      </p>
      <ol className="mt-4 grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        <Step
          n={1}
          title="Narrow down the neighbourhood"
          link={{ href: `/${CITY}/${loc.locality.slug}`, label: `${loc.locality.name} guide` }}
          example={
            <>
              <p>
                <b>{loc.locality.name}</b> scores <b className="font-mono tabular">{loc.vibe.toFixed(1)}</b> out of 10.
              </p>
              <p className="mt-1 font-mono text-[12px] leading-relaxed text-muted">{VIBE_FACTORS.map((f) => `${f.label} ${loc.locality.vibe[f.key]}`).join(" · ")}</p>
              <p className="mt-1 text-muted">
                <span className="font-mono tabular text-ink">{loc.homes}</span> homes on sale, median <span className="font-mono tabular text-ink">{formatINR(loc.medianPsfPaise, { compact: false })}</span>/sq ft
              </p>
            </>
          }
        >
          Each locality gets a score from commute, schools, green cover, price appreciation and nightlife. You see every input, not just the total.
        </Step>
        <Step
          n={2}
          title="Pick the exact flat"
          link={{ href: `/projects/${p.slug}#explorer`, label: `Open ${p.name}` }}
          example={
            <>
              <p>
                <b>{p.name}</b>: {p.towers.length} {p.towers.length === 1 ? "tower" : "towers"},{" "}
                <span className="font-mono tabular">{summary.available}</span> of <span className="font-mono tabular">{summary.total}</span> flats available.
              </p>
              <p className="mt-1 text-muted">
                Price list version {p.priceList.version}, effective {priceListDate}. RERA <span className="font-mono text-[12px]">{p.rera.number}</span>
              </p>
            </>
          }
        >
          Open the tower floor by floor. Every flat shows whether it is available, on hold or sold, with its own price from the developer&apos;s price list.
        </Step>
        <Step
          n={3}
          title="Check the light before you go"
          link={{ href: `/projects/${p.slug}/walk/${typeIndex}?unit=${encodeURIComponent(unit.number)}`, label: `Walk flat ${unit.number}` }}
          example={
            <>
              <p>
                <b>Flat {unit.number}</b>, {type.name}, {ordinal(unit.floor)} floor, facing {COMPASS_NAME[unit.facing]}.
              </p>
              <p className="mt-1 text-muted">
                At 9 am on 21 December the sun is <span className="font-mono tabular text-ink">{Math.round(sun.altitude)}°</span> up in the {COMPASS_NAME[compassPoint(sun.bearing)]}
                {litWalls.length ? `, on the ${litWalls.join(" and ")} ${litWalls.length === 1 ? "wall" : "walls"}.` : "."}
              </p>
            </>
          }
        >
          Walk the flat in 3D with the sun where it really is, for any date and hour. Check whether your sofa or bed fits each room.
        </Step>
        <Step
          n={4}
          title="Visit several homes in one trip"
          link={{ href: "/shortlist", label: "Open your shortlist" }}
          example={
            <ul className="grid gap-1.5">
              {visits.map((v) => (
                <li key={v.id} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2">
                  <span className="font-mono tabular">{v.start}</span>
                  <span>
                    {v.label}
                    {v.travelMinutes > 0 && <span className="block text-[12px] text-muted">{v.travelMinutes} min from the last stop</span>}
                  </span>
                </li>
              ))}
            </ul>
          }
        >
          Shortlist homes from any developer, broker or owner. The plan puts them in the order that keeps travel short, with time for each visit.
        </Step>
      </ol>
      <p className="mt-2 text-[12px] text-muted">Travel times are estimates from distance at city traffic speeds. Sun position is calculated for the project&apos;s location.</p>
    </section>
  );
}
