import { VIBE_FACTORS, formatINR, haversineKm, vibeScore, type Locality } from "@vybe/core";
import { getCity, listCities, listLocalities, localityStats } from "@vybe/core/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DemoTag, Eyebrow, btn } from "@/components/ui";

type Props = { params: Promise<{ city: string }>; searchParams: Promise<{ a?: string; b?: string }> };

export function generateStaticParams() {
  return listCities().map((c) => ({ city: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCity((await params).city);
  return city ? { title: `Compare localities in ${city.name}: vibe check`, alternates: { canonical: `/${city.id}/vibe-check` } } : {};
}

/** Score ring: the arc length is the score out of 10. */
function Ring({ score, tone, label }: { score: number; tone: "accent" | "navy"; label: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <figure className="grid justify-items-center gap-1">
      <svg viewBox="0 0 100 100" className="size-32" role="img" aria-label={`${label}: vibe score ${score.toFixed(1)} out of 10`}>
        <circle cx="50" cy="50" r={r} className="fill-none stroke-bg" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={r}
          className={`fill-none transition-[stroke-dasharray] duration-[var(--motion-fly)] ${tone === "accent" ? "stroke-accent" : "stroke-navy"}`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(score / 10) * c} ${c}`}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="fill-ink font-display" style={{ fontSize: 22, fontWeight: 700 }}>
          {score.toFixed(1)}
        </text>
      </svg>
      <figcaption className="text-center font-bold">{label}</figcaption>
    </figure>
  );
}

export default async function VibeCheckPage({ params, searchParams }: Props) {
  const city = getCity((await params).city);
  if (!city) notFound();
  const locs = listLocalities(city.id);
  const q = await searchParams;
  const pickA = locs.find((l) => l.slug === q.a) ?? locs[0]!;
  const pickB = locs.find((l) => l.slug === q.b && l.slug !== pickA.slug) ?? locs.find((l) => l.slug !== pickA.slug)!;
  const stats = localityStats(city.id);
  const stat = (l: Locality) => stats.find((s) => s.locality.slug === l.slug)!;
  const km = haversineKm(pickA.center, pickB.center);
  const select = "rounded-full border-2 bg-raised px-3 py-1.5 text-[14px] font-semibold";

  return (
    <div className="mx-auto max-w-[1060px] px-4 pt-7">
      <Breadcrumbs items={[{ label: city.name, href: `/${city.id}` }, { label: "Vibe check" }]} />
      <Eyebrow className="mt-3">Vibe check · {city.region}</Eyebrow>
      <h1 className="mt-2 font-display text-[clamp(28px,3.6vw,42px)] font-bold leading-[1.05] tracking-tight">Compare two localities</h1>
      <p className="mt-2 max-w-[60ch] text-muted">Commute, schools, green cover, nightlife and price growth side by side, with what homes cost in each and how many are on the market.</p>

      <form method="get" className="mt-6 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="vc-a">
          First locality
        </label>
        <select id="vc-a" name="a" defaultValue={pickA.slug} className={`${select} border-accent`}>
          {locs.map((l) => (
            <option key={l.slug} value={l.slug}>
              {l.name}
            </option>
          ))}
        </select>
        <span className="text-muted">vs</span>
        <label className="sr-only" htmlFor="vc-b">
          Second locality
        </label>
        <select id="vc-b" name="b" defaultValue={pickB.slug} className={`${select} border-navy`}>
          {locs.map((l) => (
            <option key={l.slug} value={l.slug}>
              {l.name}
            </option>
          ))}
        </select>
        <button type="submit" className={`${btn.primary} ${btn.small}`}>
          Compare
        </button>
      </form>

      <section className="mt-6 grid gap-6 rounded-[22px] border border-line bg-raised p-5 md:grid-cols-[auto_minmax(0,1fr)]" aria-label="Scores">
        <div className="flex justify-center gap-6">
          <Ring score={vibeScore(pickA.vibe)} tone="accent" label={pickA.name} />
          <Ring score={vibeScore(pickB.vibe)} tone="navy" label={pickB.name} />
        </div>
        <table className="w-full self-center text-[13.5px]">
          <thead>
            <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-muted">
              <th className="py-1.5 font-medium">Factor (weight)</th>
              <th className="py-1.5 font-medium">{pickA.name}</th>
              <th className="py-1.5 font-medium">{pickB.name}</th>
            </tr>
          </thead>
          <tbody>
            {VIBE_FACTORS.map((f) => {
              const a = pickA.vibe[f.key];
              const b = pickB.vibe[f.key];
              return (
                <tr key={f.key} className="border-t border-line">
                  <th scope="row" className="py-2 text-left font-normal">
                    {f.label} <span className="text-muted">({Math.round(f.weight * 100)}%)</span>
                  </th>
                  {[
                    { v: a, win: a > b, tone: "bg-accent" },
                    { v: b, win: b > a, tone: "bg-navy" },
                  ].map((x, i) => (
                    <td key={i} className="py-2 pr-3">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-24 overflow-hidden rounded-full bg-bg" aria-hidden>
                          <span className={`block h-full rounded-full ${x.tone}`} style={{ width: `${x.v * 10}%` }} />
                        </span>
                        <span className={`font-mono tabular ${x.win ? "font-bold" : ""}`}>{x.v}</span>
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted">
        <DemoTag />
        <span>Factor inputs are placeholders until the locality data source is chosen. Each will show its source and date.</span>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="Market">
        {[pickA, pickB].map((l) => {
          const s = stat(l);
          return (
            <article key={l.slug} className="grid gap-3 rounded-[22px] border border-line bg-raised p-5">
              <h2 className="text-lg font-bold">{l.name}</h2>
              <dl className="grid grid-cols-2 gap-3 text-[13.5px]">
                <div>
                  <dt className="text-muted">Median price</dt>
                  <dd className="font-mono text-base tabular">{formatINR(s.medianPsfPaise, { compact: false })}/sq ft</dd>
                </div>
                <div>
                  <dt className="text-muted">Homes available</dt>
                  <dd className="font-mono text-base tabular">{s.homes}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Link href={`/${city.id}?locality=${l.slug}#results`} className={`${btn.primary} ${btn.small}`}>
                  Homes in {l.name}
                </Link>
                <Link href={`/${city.id}/${l.slug}`} className={`${btn.ghost} ${btn.small}`}>
                  Locality guide
                </Link>
              </div>
            </article>
          );
        })}
      </section>
      <p className="mt-3 text-[13px] text-muted">
        {pickA.name} and {pickB.name} are about {km.toFixed(0)} km apart in a straight line. Median price and homes come from live listings on Vybe (carpet area).
      </p>
    </div>
  );
}
