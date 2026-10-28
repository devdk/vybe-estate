import { VIBE_FACTORS, formatINR, haversineKm, vibeScore } from "@vybe/core";
import { getCity, getLocality, listCities, listLocalities, localityStats, search } from "@vybe/core/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Results } from "@/components/Results";
import { DemoTag, Eyebrow, btn } from "@/components/ui";

type Props = { params: Promise<{ city: string; locality: string }> };

export function generateStaticParams() {
  return listCities().flatMap((c) => listLocalities(c.id).map((l) => ({ city: c.id, locality: l.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, locality } = await params;
  const loc = getLocality(city, locality);
  const c = getCity(city);
  if (!loc || !c) return {};
  return { title: `${loc.name}, ${c.name}: homes, prices and vibe score`, alternates: { canonical: `/${c.id}/${loc.slug}` } };
}

export default async function LocalityPage({ params }: Props) {
  const { city: cityId, locality: slug } = await params;
  const city = getCity(cityId);
  const loc = getLocality(cityId, slug);
  if (!city || !loc) notFound();
  const stat = localityStats(city.id).find((s) => s.locality.slug === loc.slug)!;
  const filters = { cityId: city.id, localitySlug: loc.slug };
  const cards = search(filters);
  const nearby = listLocalities(city.id)
    .filter((l) => l.slug !== loc.slug)
    .map((l) => ({ l, km: haversineKm(loc.center, l.center) }))
    .sort((a, b) => a.km - b.km);

  return (
    <div className="mx-auto max-w-[1260px] px-4 pt-7">
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
        <Link href={`/${city.id}`} className="hover:text-ink">
          {city.name}
        </Link>{" "}
        / <span className="text-ink">{loc.name}</span>
      </nav>
      <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <Eyebrow>Locality guide</Eyebrow>
          <h1 className="mt-2 font-display text-[clamp(30px,4vw,46px)] font-bold leading-[1.05] tracking-tight">{loc.name}</h1>
          <dl className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-line bg-raised p-3.5">
              <dt className="text-[12.5px] text-muted">Homes available</dt>
              <dd className="font-display text-2xl tabular">{stat.homes}</dd>
            </div>
            <div className="rounded-2xl border border-line bg-raised p-3.5">
              <dt className="text-[12.5px] text-muted">Median ₹/sq ft</dt>
              <dd className="font-display text-2xl tabular">{formatINR(stat.medianPsfPaise, { compact: false })}</dd>
            </div>
            <div className="rounded-2xl border border-line bg-raised p-3.5">
              <dt className="text-[12.5px] text-muted">Vibe score</dt>
              <dd className="font-display text-2xl tabular">{vibeScore(loc.vibe).toFixed(1)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-[12px] text-muted">Homes and prices from live listings on Vybe (carpet area). RERA authority: {loc.reraAuthority}.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/${city.id}?locality=${loc.slug}#results`} className={btn.primary}>
              Search homes in {loc.name}
            </Link>
            <Link href={`/${city.id}/vibe-check?a=${loc.slug}&b=${nearby[0]?.l.slug ?? ""}`} className={btn.ghost}>
              Compare with {nearby[0]?.l.name ?? "another locality"}
            </Link>
          </div>
        </div>

        <section className="rounded-[22px] border border-line bg-raised p-5" aria-labelledby="vibe-h">
          <div className="flex items-center justify-between gap-2">
            <h2 id="vibe-h" className="text-base font-bold">
              What makes up the score
            </h2>
            <DemoTag />
          </div>
          <ul className="mt-4 grid gap-3">
            {VIBE_FACTORS.map((f) => (
              <li key={f.key} className="grid grid-cols-[110px_1fr_36px] items-center gap-3 text-[13.5px]">
                <span>{f.label}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-bg" role="img" aria-label={`${f.label}: ${loc.vibe[f.key]} out of 10`}>
                  <span className="block h-full rounded-full bg-navy" style={{ width: `${loc.vibe[f.key] * 10}%` }} />
                </span>
                <span className="text-right font-mono tabular">{loc.vibe[f.key]}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[12px] text-muted">
            Weights: {VIBE_FACTORS.map((f) => `${f.label.toLowerCase()} ${Math.round(f.weight * 100)}%`).join(", ")}. Inputs here are placeholders until the locality data source is chosen (maps API, open data or partner data).
          </p>
        </section>
      </div>

      <section className="pt-12" aria-labelledby="homes-h">
        <h2 id="homes-h" className="mb-4 font-display text-[clamp(22px,3vw,30px)] font-bold tracking-tight">
          Homes in {loc.name}
        </h2>
        <Results cards={cards} filters={filters} cityName={city.name} />
      </section>

      <section className="pt-12" aria-labelledby="near-h">
        <h2 id="near-h" className="mb-3 text-lg font-bold">
          Nearby localities
        </h2>
        <ul className="flex flex-wrap gap-2">
          {nearby.map(({ l, km }) => (
            <li key={l.slug}>
              <Link href={`/${city.id}/${l.slug}`} className={`${btn.ghost} ${btn.small}`}>
                {l.name} <span className="font-mono text-[11px] font-normal text-muted">{km.toFixed(0)} km</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
