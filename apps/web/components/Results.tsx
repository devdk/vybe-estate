import { filtersToQuery, formatBhk, formatINR, type SearchCard, type SearchFilters } from "@vybe/core";
import { getLocality, suggestAlternatives } from "@vybe/core/catalog";
import Link from "next/link";
import { ListingCard } from "./ListingCard";
import { btn } from "./ui";

/** "No 3 BHK under ₹1.5 Cr in Baner yet." */
function emptyText(f: SearchFilters, cityName: string): string {
  const what = f.bhk?.length ? f.bhk.map(formatBhk).join(" or ") : f.category === "rent" ? "rentals" : "homes";
  const budget = f.maxPaise ? ` under ${formatINR(f.maxPaise)}${f.category === "rent" ? "/month" : ""}` : "";
  const where = f.localitySlug ? (getLocality(f.cityId, f.localitySlug)?.name ?? cityName) : cityName;
  return `No ${what}${budget} in ${where} yet.`;
}

export function Results({ cards, filters, cityName }: { cards: SearchCard[]; filters: SearchFilters; cityName: string }) {
  if (cards.length === 0) {
    const suggestions = suggestAlternatives(filters);
    return (
      <div className="rounded-[20px] border border-dashed border-line px-6 py-10 text-center">
        <p className="text-lg font-bold">{emptyText(filters, cityName)}</p>
        {suggestions.length > 0 ? (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {suggestions.map((s) => (
              <Link key={s.label} href={`/${filters.cityId}${filtersToQuery(s.filters)}#results`} className={`${btn.ghost} ${btn.small}`}>
                {s.label} ({s.count})
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-muted">
            <Link href={`/${filters.cityId}#results`} className="font-bold text-accent-strong">
              Clear the filters
            </Link>{" "}
            to see every home in {cityName}.
          </p>
        )}
      </div>
    );
  }
  return (
    <ul className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <li key={c.id}>
          <ListingCard card={c} />
        </li>
      ))}
    </ul>
  );
}
