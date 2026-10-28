import { CATEGORIES, allUnits, formatINR, formatINRRange, formatPossession, formatSqft, projectSummary, scarcityText } from "@vybe/core";
import { getCity, getLocality, getPartner, getProject, listProjects, projectsByPartner, similarProjects } from "@vybe/core/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmiCalculator } from "@/components/EmiCalculator";
import { FloorPlan, RoomTable } from "@/components/FloorPlan";
import { JsonLd } from "@/components/JsonLd";
import { ListingCard } from "@/components/ListingCard";
import { LocationPanel } from "@/components/LocationPanel";
import { ReportProblem } from "@/components/ReportProblem";
import { ProjectExplorer } from "@/components/ProjectExplorer";
import { BookVisitButton } from "@/components/ShortlistButton";
import { ArrowIcon, CubeIcon, DemoTag, Eyebrow, PartnerLine, btn } from "@/components/ui";
import { explorerTowers } from "@/lib/showroom-data";
import { SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ unit?: string }> };

export function generateStaticParams() {
  return listProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProject((await params).slug);
  if (!p) return {};
  const s = projectSummary(p);
  const loc = getLocality(p.cityId, p.localitySlug)!;
  return {
    title: `${p.name}, ${loc.name}: ${s.bhks.join(", ")} BHK from ${formatINR(s.priceFrom)}`,
    description: `${p.name} in ${loc.name}. ${s.available} of ${s.total} flats available, ${formatSqft(s.carpetMin)}–${formatSqft(s.carpetMax)} carpet, possession ${formatPossession(p.possession)}. RERA ${p.rera.number}.`,
    alternates: { canonical: `/projects/${p.slug}` },
  };
}

export default async function ProjectPage({ params, searchParams }: Props) {
  const p = getProject((await params).slug);
  if (!p) notFound();
  const { unit } = await searchParams;
  const city = getCity(p.cityId)!;
  const loc = getLocality(p.cityId, p.localitySlug)!;
  const dev = getPartner(p.developerId)!;
  const s = projectSummary(p);
  const scarcity = scarcityText(s.available);
  const units = allUnits(p);
  const category = CATEGORIES.find((c) => c.id === p.category)!.label;
  const url = `/projects/${p.slug}`;
  const similar = similarProjects(p);
  const abs = (path: string) => `${SITE_URL}${path}`;

  return (
    <div className="mx-auto max-w-[1260px] px-4 pt-7">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            name: p.name,
            url: abs(url),
            about: {
              "@type": "Residence",
              name: p.name,
              address: { "@type": "PostalAddress", addressLocality: loc.name, addressRegion: city.state, addressCountry: "IN" },
              geo: { "@type": "GeoCoordinates", latitude: p.location[1], longitude: p.location[0] },
            },
            offers: { "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: s.priceFrom / 100, highPrice: s.priceTo / 100, offerCount: s.available },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: city.name, item: abs(`/${city.id}`) },
              { "@type": "ListItem", position: 2, name: loc.name, item: abs(`/${city.id}/${loc.slug}`) },
              { "@type": "ListItem", position: 3, name: p.name, item: abs(url) },
            ],
          },
        ]}
      />
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
        <Link href={`/${city.id}`} className="hover:text-ink">
          {city.name}
        </Link>{" "}
        /{" "}
        <Link href={`/${city.id}/${loc.slug}`} className="hover:text-ink">
          {loc.name}
        </Link>{" "}
        / <span className="text-ink">{p.name}</span>
      </nav>

      <header className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <Eyebrow>
            {category} · {loc.name}
          </Eyebrow>
          <h1 className="mt-2 font-display text-[clamp(30px,4vw,46px)] font-bold leading-[1.05] tracking-tight">{p.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <PartnerLine {...dev} />
            <DemoTag />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <BookVisitButton
            item={{
              key: `project:${p.slug}`,
              kind: "project",
              title: `${p.name} sample flat`,
              subtitle: `${s.bhks.join(", ")} BHK · ${loc.name}`,
              href: url,
              pricePaise: s.priceFrom,
              isRent: false,
              partnerName: dev.name,
              location: p.location,
              cityId: p.cityId,
            }}
          />
        </div>
      </header>

      {/* Facts first: what a buyer needs before anything else, visible without signing in. */}
      <dl className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Price (available flats)", <span key="p" data-testid="price">{s.available ? formatINRRange(s.priceFrom, s.priceTo) : "Sold out"}</span>],
          ["Carpet area", `${formatSqft(s.carpetMin)} – ${formatSqft(s.carpetMax)}`],
          ["Possession", formatPossession(p.possession)],
          ["Available", scarcity ?? `${s.available} of ${s.total} flats`],
          ["Maintenance", `${formatINR(p.maintenancePaisePerSqft, { compact: false })}/sq ft a month`],
          ["RERA", <span key="r" data-testid="rera">{p.rera.number}</span>],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-2xl border border-line bg-raised p-3.5">
            <dt className="text-[12px] text-muted">{label}</dt>
            <dd className="mt-0.5 font-mono text-[14.5px] font-medium tabular">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[12px] text-muted">
        RERA registration with {p.rera.authority}; check it on the authority&apos;s website before paying anything. Prices from price list v{p.priceList.version}, effective{" "}
        {new Date(p.priceList.effectiveFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.
      </p>

      <section id="explorer" className="scroll-mt-20 pt-10" aria-labelledby="explorer-h">
        <h2 id="explorer-h" className="mb-4 font-display text-[clamp(22px,3vw,30px)] font-bold tracking-tight">
          Tower explorer
        </h2>
        <ProjectExplorer
          project={{ slug: p.slug, name: p.name, cityId: p.cityId, localityName: loc.name, location: p.location, developerName: dev.name, maintenancePaisePerSqft: p.maintenancePaisePerSqft }}
          towers={explorerTowers(p)}
          unitTypes={p.unitTypes.map((t) => ({ name: t.name, carpetSqft: t.carpetSqft }))}
          initialUnit={unit}
        />
      </section>

      <section className="pt-12" aria-labelledby="prices-h">
        <h2 id="prices-h" className="mb-4 font-display text-[clamp(22px,3vw,30px)] font-bold tracking-tight">
          Price list
        </h2>
        <div className="overflow-x-auto rounded-[22px] border border-line bg-raised">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-muted">
                {["Type", "Carpet", "Built-up", "Super built-up", "Parking", "Available", "Price"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {p.unitTypes.map((t) => {
                const avail = units.filter((u) => u.unitTypeId === t.id && u.status === "available").map((u) => u.pricePaise);
                return (
                  <tr key={t.id} className="border-t border-line">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold">{t.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono tabular">{formatSqft(t.carpetSqft)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono tabular">{formatSqft(t.builtUpSqft)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono tabular">{formatSqft(t.superBuiltUpSqft)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{t.parking} covered</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono tabular">{avail.length}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono tabular">{avail.length ? formatINRRange(Math.min(...avail), Math.max(...avail)) : "Sold out"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[12px] text-muted">Carpet area as defined under RERA (excludes balconies). Prices rise with floor and are a little higher for north and east facing flats.</p>
      </section>

      <section className="pt-12" aria-labelledby="plans-h">
        <h2 id="plans-h" className="mb-4 font-display text-[clamp(22px,3vw,30px)] font-bold tracking-tight">
          Floor plans
        </h2>
        <div className="grid gap-[18px] md:grid-cols-2">
          {p.unitTypes.map((t, i) => (
            <article key={t.id} className="grid gap-4 rounded-[22px] border border-line bg-raised p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-base font-bold">{t.name}</h3>
                <span className="font-mono text-[13px] text-muted">{formatSqft(t.carpetSqft)} carpet</span>
              </div>
              <FloorPlan rooms={t.rooms} title={`${t.name} floor plan`} />
              <RoomTable rooms={t.rooms} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] text-muted">Schematic drawn from room sizes. The developer&apos;s plan replaces it once uploaded.</p>
                <Link href={`/projects/${p.slug}/walk/${i}`} className={`${btn.ghost} ${btn.small}`}>
                  <CubeIcon /> Walk it with the real sun
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-[18px] pt-12 md:grid-cols-2">
        <div className="rounded-[22px] border border-line bg-raised p-5">
          <h2 className="mb-3 text-base font-bold">Amenities</h2>
          <ul className="flex flex-wrap gap-2 text-[13.5px]">
            {p.amenities.map((a) => (
              <li key={a} className="rounded-lg bg-bg px-2.5 py-1">
                {a}
              </li>
            ))}
          </ul>
        </div>
        {s.available > 0 && (
          <div className="rounded-[22px] border border-line bg-raised p-5">
            <h2 className="mb-3 text-base font-bold">EMI for the lowest-priced available flat ({formatINR(s.priceFrom)})</h2>
            <EmiCalculator pricePaise={s.priceFrom} />
          </div>
        )}
      </section>

      <section className="grid gap-[18px] pt-12 md:grid-cols-2" aria-label="Location and developer">
        <LocationPanel location={p.location} cityId={city.id} locality={loc} />
        <div className="grid content-start gap-3 rounded-[22px] border border-line bg-raised p-5">
          <h2 className="text-base font-bold">Developer</h2>
          <PartnerLine {...dev} />
          <p className="text-[13.5px] text-muted">
            Building since {dev.since}. {projectsByPartner(dev.id).length} {projectsByPartner(dev.id).length === 1 ? "project" : "projects"} on Vybe.
          </p>
          <Link href={`/partners/${dev.id}`} className="inline-flex items-center gap-1 text-[13.5px] font-bold text-accent-strong">
            All projects by {dev.name} <ArrowIcon className="size-3.5" />
          </Link>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="pt-12" aria-labelledby="similar-h">
          <h2 id="similar-h" className="mb-4 font-display text-[clamp(22px,3vw,30px)] font-bold tracking-tight">
            Similar projects in {city.name}
          </h2>
          <ul className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((c) => (
              <li key={c.id}>
                <ListingCard card={c} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 max-w-[560px]">
        <ReportProblem target={`project:${p.slug}`} />
      </div>
    </div>
  );
}
