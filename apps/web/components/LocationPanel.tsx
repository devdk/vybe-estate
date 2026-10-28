import { haversineKm, type LngLat, type Locality } from "@vybe/core";
import { listLocalities } from "@vybe/core/catalog";
import Link from "next/link";
import { ArrowIcon } from "./ui";

/** Where the home is: coordinates, a map link, and the nearest other localities by distance. */
export function LocationPanel({ location, cityId, locality }: { location: LngLat; cityId: Locality["cityId"]; locality: Locality }) {
  const [lng, lat] = location;
  const nearby = listLocalities(cityId)
    .filter((l) => l.slug !== locality.slug)
    .map((l) => ({ l, km: haversineKm(location, l.center) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 3);
  return (
    <div className="grid content-start gap-3 rounded-[22px] border border-line bg-raised p-5">
      <h2 className="text-base font-bold">Location</h2>
      <p className="text-[14px]">
        {locality.name} · <span className="font-mono text-[12.5px] text-muted">{lat.toFixed(4)}° N, {lng.toFixed(4)}° E</span>
      </p>
      <ul className="grid gap-1 text-[13.5px] text-muted">
        {nearby.map(({ l, km }) => (
          <li key={l.slug}>
            <span className="font-mono tabular text-ink">{km.toFixed(1)} km</span> to the centre of{" "}
            <Link href={`/${cityId}/${l.slug}`} className="text-ink underline decoration-line underline-offset-2 hover:decoration-ink">
              {l.name}
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] font-bold">
        <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent-strong">
          Open in Google Maps <ArrowIcon className="size-3.5" />
        </a>
        <Link href={`/${cityId}/${locality.slug}`} className="inline-flex items-center gap-1 text-accent-strong">
          {locality.name} guide <ArrowIcon className="size-3.5" />
        </Link>
      </div>
      <p className="text-[12px] text-muted">Distances are straight-line. Commute times to metro, schools and offices arrive with the locality data source.</p>
    </div>
  );
}
