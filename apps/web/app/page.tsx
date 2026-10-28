import { CATEGORIES, SALE_BUDGETS, formatINR } from "@vybe/core";
import { categoryCounts, listCities, search } from "@vybe/core/catalog";
import Link from "next/link";
import { HomeShowroom } from "@/components/HomeShowroom";
import { ListingCard } from "@/components/ListingCard";
import { ArrowIcon, Eyebrow, Stat, btn } from "@/components/ui";
import { cityDistricts } from "@/lib/showroom-data";

const select = "min-w-[7.5rem] flex-1 rounded-xl border-0 bg-transparent py-2 text-[15px] font-semibold outline-none";

export default function HomePage() {
  const cities = listCities();
  const worlds = Object.fromEntries(cities.map((c) => [c.id, cityDistricts(c.id)]));
  const counts = Object.fromEntries(cities.map((c) => [c.id, categoryCounts(c.id)]));
  // The new launch with the most flats still available in each city.
  const launches = cities.flatMap((c) => search({ cityId: c.id, category: "new-launch" }).sort((a, b) => (b.available ?? 0) - (a.available ?? 0)).slice(0, 1));
  return (
    <div className="mx-auto max-w-[1260px] px-4">
      <section className="grid gap-7 pt-7 lg:grid-cols-[minmax(0,.82fr)_minmax(0,1.3fr)]">
        <div className="flex flex-col justify-center">
          <Eyebrow>India&apos;s top 5 housing markets, in 3D</Eyebrow>
          <h1 className="mt-2 font-display text-[clamp(34px,4.6vw,60px)] font-bold leading-[1.02] tracking-tight">
            Feel the place <em className="not-italic text-accent">before you visit it.</em>
          </h1>
          <p className="mt-4 max-w-[44ch] text-[16.5px] text-muted">See which neighbourhoods have homes in your budget, open the tower, pick the exact flat, and book visits with several sellers on the same day.</p>
          <form action="/search" method="get" role="search" className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-raised p-1.5 pl-3.5 shadow-[0_14px_30px_-20px_rgba(17,24,39,.4)]">
            <label className="sr-only" htmlFor="q-city">
              City
            </label>
            <select id="q-city" name="city" className={select} defaultValue="mumbai">
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="q-bhk">
              Bedrooms
            </label>
            <select id="q-bhk" name="bhk" className={select} defaultValue="">
              <option value="">Any BHK</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} BHK
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="q-max">
              Budget
            </label>
            <select id="q-max" name="max" className={select} defaultValue="">
              <option value="">Any budget</option>
              {SALE_BUDGETS.map((b) => (
                <option key={b} value={b / 100}>
                  Up to {formatINR(b)}
                </option>
              ))}
            </select>
            <button type="submit" className={btn.primary}>
              Search
            </button>
          </form>
        </div>
        <HomeShowroom cities={cities.map((c) => ({ id: c.id, name: c.name }))} worlds={worlds} />
      </section>

      <section className="pt-14" aria-labelledby="cities-h">
        <h2 id="cities-h" className="font-display text-[clamp(22px,3vw,30px)] font-bold tracking-tight">
          Five cities, {cities.reduce((n, c) => n + c.sales.units, 0).toLocaleString("en-IN")} homes sold last quarter
        </h2>
        <p className="mt-1 font-mono text-[11px] text-muted">Anarock, Q3 2026</p>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cities.map((c) => {
            const top = [...worlds[c.id]!].sort((a, b) => b.homes - a.homes).slice(0, 3);
            return (
              <li key={c.id} className="relative grid gap-3 rounded-[22px] border border-line bg-raised p-4">
                <h3 className="text-lg font-bold">
                  <Link href={`/${c.id}`} className="after:absolute after:inset-0 after:content-['']">
                    {c.region}
                  </Link>
                </h3>
                <Stat label={`homes sold, ${c.sales.yoyPct > 0 ? "+" : "−"}${Math.abs(c.sales.yoyPct)}% on last year`} value={c.sales.units.toLocaleString("en-IN")} source={c.sales} />
                <p className="text-[13px] text-muted">Most homes listed: {top.map((d) => d.name).join(", ")}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-[13px] font-bold text-accent-strong">
                  Explore {c.name} <ArrowIcon className="size-3.5" />
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="pt-14" aria-labelledby="market-h">
        <h2 id="market-h" className="font-display text-[clamp(22px,3vw,30px)] font-bold tracking-tight">
          On Vybe right now
        </h2>
        <p className="mt-1 text-[13.5px] text-muted">Projects with flats available and live resale and rental listings, by city. Each number opens that search.</p>
        <div className="mt-4 overflow-x-auto rounded-[22px] border border-line bg-raised">
          <table className="w-full min-w-[720px] text-[14px]">
            <thead>
              <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-muted">
                <th className="px-4 py-3 font-medium">City</th>
                {CATEGORIES.map((c) => (
                  <th key={c.id} className="px-4 py-3 text-right font-medium">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cities.map((city) => (
                <tr key={city.id} className="border-t border-line">
                  <th scope="row" className="px-4 py-2.5 text-left font-semibold">
                    <Link href={`/${city.id}`} className="hover:text-accent-strong">
                      {city.name}
                    </Link>
                  </th>
                  {CATEGORIES.map((c) => (
                    <td key={c.id} className="px-4 py-2.5 text-right font-mono tabular">
                      <Link href={`/${city.id}?type=${c.id}#results`} className="underline decoration-line underline-offset-2 hover:text-accent-strong hover:decoration-accent">
                        {counts[city.id]![c.id]}
                      </Link>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="pt-14" aria-labelledby="launch-h">
        <h2 id="launch-h" className="font-display text-[clamp(22px,3vw,30px)] font-bold tracking-tight">
          New launches
        </h2>
        <p className="mt-1 text-[13.5px] text-muted">In each city, the launch with the most flats still available. Not paid placement.</p>
        <ul className="mt-4 grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {launches.map((c) => (
            <li key={c.id}>
              <ListingCard card={c} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
