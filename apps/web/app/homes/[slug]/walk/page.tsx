import { formatBhk, formatFacing, formatSqft, ordinal } from "@vybe/core";
import { getCity, getListing, getLocality } from "@vybe/core/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { UnitWalkthrough } from "@/components/UnitWalkthrough";
import { DemoTag, Eyebrow, btn } from "@/components/ui";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = getListing((await params).slug);
  if (!l) return {};
  return { title: `Walk the ${formatBhk(l.bhk)} in ${l.buildingName}: sun path and room sizes`, alternates: { canonical: `/homes/${l.slug}/walk` } };
}

export default async function ListingWalkPage({ params }: Props) {
  const l = getListing((await params).slug);
  if (!l) notFound();
  const city = getCity(l.cityId)!;
  const loc = getLocality(l.cityId, l.localitySlug)!;
  const title = `${formatBhk(l.bhk)} in ${l.buildingName}`;
  return (
    <div className="mx-auto max-w-[1260px] px-4 pt-7">
      <Breadcrumbs
        items={[
          { label: city.name, href: `/${city.id}` },
          { label: loc.name, href: `/${city.id}/${loc.slug}` },
          { label: title, href: `/homes/${l.slug}` },
          { label: "Walk the flat" },
        ]}
      />
      <header className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <Eyebrow>Walk the unit · {loc.name}</Eyebrow>
          <h1 className="mt-2 font-display text-[clamp(28px,3.6vw,42px)] font-bold leading-[1.05] tracking-tight">
            {title}, {formatFacing(l.facing).toLowerCase()}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-muted">
            <span className="font-mono">{formatSqft(l.carpetSqft)} carpet</span>
            <span>
              {ordinal(l.floor)} of {l.totalFloors} floors
            </span>
            <DemoTag />
          </p>
        </div>
        <Link href={`/homes/${l.slug}`} className={btn.ghost}>
          Back to the listing
        </Link>
      </header>
      <section className="pt-6" aria-label="Walkthrough">
        <UnitWalkthrough rooms={l.rooms} facing={l.facing} location={l.location} />
      </section>
      <p className="mt-4 max-w-[80ch] text-[12.5px] text-muted">
        Drawn from the room sizes the seller listed and turned to its real compass direction; the sun position is calculated for {loc.name}. Highlighted walls are the outside walls the sun reaches at that moment; which rooms sit on them depends on the real plan. On the {ordinal(l.floor)} floor, neighbouring buildings may still block low morning or evening sun.
      </p>
    </div>
  );
}
