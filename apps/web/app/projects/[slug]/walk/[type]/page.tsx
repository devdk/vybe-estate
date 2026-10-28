import { allUnits, formatFacing, formatINR, formatSqft, ordinal, type Facing } from "@vybe/core";
import { getCity, getLocality, getProject } from "@vybe/core/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { UnitWalkthrough } from "@/components/UnitWalkthrough";
import { DemoTag, Eyebrow, btn } from "@/components/ui";

type Props = { params: Promise<{ slug: string; type: string }>; searchParams: Promise<{ unit?: string; facing?: string }> };

const ORDER: Facing[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function load(slug: string, type: string) {
  const p = getProject(slug);
  const t = /^\d+$/.test(type) ? p?.unitTypes[Number(type)] : undefined;
  return p && t ? { p, t } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, type } = await params;
  const d = load(slug, type);
  if (!d) return {};
  return { title: `Walk the ${d.t.name} at ${d.p.name}: sun path and room sizes`, alternates: { canonical: `/projects/${d.p.slug}/walk/${type}` } };
}

export default async function ProjectWalkPage({ params, searchParams }: Props) {
  const { slug, type } = await params;
  const d = load(slug, type);
  if (!d) notFound();
  const { p, t } = d;
  const { unit: unitNo, facing: facingParam } = await searchParams;
  const city = getCity(p.cityId)!;
  const loc = getLocality(p.cityId, p.localitySlug)!;
  const ofType = allUnits(p).filter((u) => u.unitTypeId === t.id);
  const unit = unitNo ? ofType.find((u) => u.number === unitNo) : undefined;
  const facings = ORDER.filter((f) => ofType.some((u) => u.facing === f));
  const facing = unit?.facing ?? (facings.includes(facingParam as Facing) ? (facingParam as Facing) : facings[0]!);
  const available = ofType.filter((u) => u.status === "available" && u.facing === facing).length;
  const base = `/projects/${p.slug}/walk/${type}`;

  return (
    <div className="mx-auto max-w-[1260px] px-4 pt-7">
      <Breadcrumbs
        items={[
          { label: city.name, href: `/${city.id}` },
          { label: loc.name, href: `/${city.id}/${loc.slug}` },
          { label: p.name, href: `/projects/${p.slug}` },
          { label: `Walk the ${t.name}` },
        ]}
      />
      <header className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <Eyebrow>Walk the unit · {p.name}</Eyebrow>
          <h1 className="mt-2 font-display text-[clamp(28px,3.6vw,42px)] font-bold leading-[1.05] tracking-tight">
            {unit ? `Flat ${unit.number}` : t.name}, {formatFacing(facing).toLowerCase()}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-muted">
            <span className="font-mono">{formatSqft(t.carpetSqft)} carpet</span>
            <span className="font-mono">{formatSqft(t.builtUpSqft)} built-up</span>
            <span>
              {t.bathrooms} bathrooms · {t.balconies} {t.balconies === 1 ? "balcony" : "balconies"}
            </span>
            {unit && (
              <span>
                {ordinal(unit.floor)} floor · <span className="font-mono">{formatINR(unit.pricePaise)}</span>
              </span>
            )}
            <DemoTag />
          </p>
        </div>
        <Link href={unit ? `/projects/${p.slug}?unit=${encodeURIComponent(unit.number)}#explorer` : `/projects/${p.slug}#explorer`} className={btn.ghost}>
          {unit ? "Back to this flat" : `${available} ${t.name} ${available === 1 ? "flat" : "flats"} available facing ${facing}`}
        </Link>
      </header>
      <section className="pt-6" aria-label="Walkthrough">
        <UnitWalkthrough rooms={t.rooms} facing={facing} location={p.location} facingLinks={unit ? undefined : facings.map((f) => ({ facing: f, href: `${base}?facing=${f}` }))} />
      </section>
      <p className="mt-4 max-w-[80ch] text-[12.5px] text-muted">
        The plan is drawn from the room sizes in the price list and turned to its real compass direction. The sun position is calculated for {loc.name} at the date and time you pick. Highlighted walls are the outside walls the sun reaches at that moment; which rooms sit on those walls depends on the real plan. The developer&apos;s own plan replaces this drawing once uploaded.
      </p>
    </div>
  );
}
