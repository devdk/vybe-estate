import { CATEGORIES, filtersToQuery, formatINR, parseFilters, type CityId } from "@vybe/core";
import { categoryCounts, getCity, listCities, search } from "@vybe/core/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CityShowroom } from "@/components/CityShowroom";
import { Filters } from "@/components/Filters";
import { Results } from "@/components/Results";
import { ArrowIcon, Eyebrow, Stat, chip } from "@/components/ui";
import { cityDistricts } from "@/lib/showroom-data";

type Props = { params: Promise<{ city: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export function generateStaticParams() {
  return listCities().map((c) => ({ city: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCity((await params).city);
  if (!city) return {};
  return {
    title: `Homes for sale and rent in ${city.name}`,
    description: `New launches, under-construction and ready-to-move flats, resale homes and rentals in ${city.region}, with prices, floor plans and RERA numbers on every listing.`,
    alternates: { canonical: `/${city.id}` },
  };
}

export default async function CityPage({ params, searchParams }: Props) {
  const city = getCity((await params).city);
  if (!city) notFound();
  const filters = parseFilters(city.id as CityId, await searchParams);
  const cards = search(filters);
  const districts = cityDistricts(city.id);
  const sorted = [...districts].sort((a, b) => b.homes - a.homes);
  const counts = categoryCounts(city.id);

  return (
    <div className="mx-auto max-w-[1260px] px-4">
      <section className="grid gap-7 pt-7 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.3fr)]">
        <div className="flex flex-col justify-center">
          <Eyebrow>{city.state}</Eyebrow>
          <h1 className="mt-2 font-display text-[clamp(30px,4vw,48px)] font-bold leading-[1.05] tracking-tight">Homes in {city.region}</h1>
          <p className="mt-4 max-w-[44ch] text-muted">Tap a district to see its median price, how many homes are available and its vibe score, then jump to the listings.</p>
          <div className="mt-6 flex flex-wrap gap-7">
            <Stat label="homes sold in the quarter" value={city.sales.units.toLocaleString("en-IN")} source={city.sales} />
            <Stat label="change on last year" value={`${city.sales.yoyPct > 0 ? "+" : "−"}${Math.abs(city.sales.yoyPct)}%`} source={city.sales} />
          </div>
          <table className="mt-6 w-full text-[13.5px]">
            <caption className="sr-only">Localities in {city.name}</caption>
            <thead>
              <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-muted">
                <th className="py-1.5 font-medium">Locality</th>
                <th className="py-1.5 text-right font-medium">Homes</th>
                <th className="py-1.5 text-right font-medium">₹/sq ft</th>
                <th className="py-1.5 text-right font-medium">Vibe</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => (
                <tr key={d.slug} className="border-t border-line">
                  <td className="py-1.5">
                    <Link href={`/${city.id}/${d.slug}`} className="font-semibold hover:text-accent-strong">
                      {d.name}
                    </Link>
                  </td>
                  <td className="py-1.5 text-right font-mono tabular">{d.homes}</td>
                  <td className="py-1.5 text-right font-mono tabular">{formatINR(d.medianPsfPaise, { compact: false })}</td>
                  <td className="py-1.5 text-right font-mono tabular">{d.vibe.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link href={`/${city.id}/vibe-check`} className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-bold text-accent-strong">
            Compare two localities <ArrowIcon className="size-3.5" />
          </Link>
        </div>
        <CityShowroom cityId={city.id} cityName={city.name} districts={districts} />
      </section>

      <section id="results" className="scroll-mt-20 pt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-[clamp(22px,3vw,30px)] font-bold tracking-tight">
            {filters.category === "rent" ? "Rentals" : "Homes"} in {city.name}
          </h2>
          <p className="text-sm text-muted" aria-live="polite">
            {cards.length} {cards.length === 1 ? "result" : "results"}
          </p>
        </div>
        <nav aria-label="Categories" className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <Link key={c.id} href={`/${city.id}${filtersToQuery({ ...filters, category: c.id, maxPaise: undefined, minPaise: undefined })}#results`} aria-current={filters.category === c.id ? "page" : undefined} className={chip(filters.category === c.id)}>
              {c.label} <span className="font-mono text-[11.5px] opacity-70">{counts[c.id]}</span>
            </Link>
          ))}
        </nav>
        <Filters key={JSON.stringify(filters)} cityId={city.id} filters={filters} localities={districts.map((d) => ({ slug: d.slug, name: d.name }))} />
        <div className="mt-5">
          <Results cards={cards} filters={filters} cityName={city.name} />
        </div>
      </section>
    </div>
  );
}
