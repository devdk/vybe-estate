import { formatBhk, formatFacing, formatINR, formatSqft, ordinal } from "@vybe/core";
import { getCity, getListing, getLocality, getPartner, listListings, listingsByPartner, similarListings } from "@vybe/core/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmiCalculator } from "@/components/EmiCalculator";
import { FloorPlan, RoomTable } from "@/components/FloorPlan";
import { JsonLd } from "@/components/JsonLd";
import { ListingCard } from "@/components/ListingCard";
import { LocationPanel } from "@/components/LocationPanel";
import { ReportProblem } from "@/components/ReportProblem";
import { BookVisitButton, ShortlistButton } from "@/components/ShortlistButton";
import { ArrowIcon, CubeIcon, DemoTag, Eyebrow, PartnerLine, btn } from "@/components/ui";
import type { ShortlistItem } from "@/lib/store";
import { SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listListings().map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = getListing((await params).slug);
  if (!l) return {};
  const loc = getLocality(l.cityId, l.localitySlug)!;
  const price = l.kind === "rent" ? `${formatINR(l.pricePaise, { compact: false })}/month` : formatINR(l.pricePaise);
  return {
    title: `${formatBhk(l.bhk)} ${l.kind === "rent" ? "for rent" : "for sale"} in ${l.buildingName}, ${loc.name} · ${price}`,
    description: `${formatSqft(l.carpetSqft)} carpet, ${ordinal(l.floor)} of ${l.totalFloors} floors, ${formatFacing(l.facing).toLowerCase()}, ${l.furnishing.toLowerCase()}. ${price}.`,
    alternates: { canonical: `/homes/${l.slug}` },
  };
}

export default async function ListingPage({ params }: Props) {
  const l = getListing((await params).slug);
  if (!l) notFound();
  const city = getCity(l.cityId)!;
  const loc = getLocality(l.cityId, l.localitySlug)!;
  const partner = getPartner(l.partnerId)!;
  const rent = l.kind === "rent";
  const similar = similarListings(l);
  const title = `${formatBhk(l.bhk)} in ${l.buildingName}`;
  const price = rent ? `${formatINR(l.pricePaise, { compact: false })}/month` : formatINR(l.pricePaise);
  const item: ShortlistItem = {
    key: `listing:${l.slug}`,
    kind: "listing",
    title,
    subtitle: `${formatSqft(l.carpetSqft)} · ${ordinal(l.floor)} floor · ${loc.name}`,
    href: `/homes/${l.slug}`,
    pricePaise: l.pricePaise,
    isRent: rent,
    partnerName: partner.name,
    location: l.location,
    cityId: l.cityId,
  };

  const facts: [string, React.ReactNode][] = [
    [rent ? "Rent" : "Price", <span key="p" data-testid="price">{price}</span>],
    ["Carpet area", formatSqft(l.carpetSqft)],
    ["Floor", `${ordinal(l.floor)} of ${l.totalFloors}`],
    ["Facing", formatFacing(l.facing)],
    ["Possession", "Ready to move"],
    ["Parking", `${l.parking} covered`],
    ["Maintenance", `${formatINR(l.maintenancePaisePerMonth, { compact: false })}/month`],
    ["Furnishing", l.furnishing],
    ["Building age", `${l.ageYears} years`],
    ...(rent ? ([["Deposit", formatINR(l.depositPaise ?? 0, { compact: false })], ["Minimum lease", `${l.minLeaseMonths} months`]] as [string, string][]) : []),
    ["RERA", <span key="r" data-testid="rera">{l.rera ? `${l.rera.number} (${l.rera.authority})` : "Building not in a RERA-registered project"}</span>],
  ];

  return (
    <div className="mx-auto max-w-[1260px] px-4 pt-7">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          name: title,
          url: `${SITE_URL}/homes/${l.slug}`,
          datePosted: l.postedOn,
          about: {
            "@type": "Apartment",
            numberOfRooms: l.bhk,
            floorSize: { "@type": "QuantitativeValue", value: l.carpetSqft, unitCode: "FTK" },
            address: { "@type": "PostalAddress", addressLocality: loc.name, addressRegion: city.state, addressCountry: "IN" },
          },
          offers: { "@type": "Offer", priceCurrency: "INR", price: l.pricePaise / 100, ...(rent ? { businessFunction: "http://purl.org/goodrelations/v1#LeaseOut" } : {}) },
        }}
      />
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
        <Link href={`/${city.id}`} className="hover:text-ink">
          {city.name}
        </Link>{" "}
        /{" "}
        <Link href={`/${city.id}/${loc.slug}`} className="hover:text-ink">
          {loc.name}
        </Link>{" "}
        / <span className="text-ink">{title}</span>
      </nav>

      <header className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <Eyebrow>
            {rent ? "For rent" : "Resale"} · {loc.name}
          </Eyebrow>
          <h1 className="mt-2 font-display text-[clamp(28px,3.6vw,42px)] font-bold leading-[1.05] tracking-tight">{title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <PartnerLine {...partner} />
            {partner.agentRera && <span className="font-mono text-[11px] text-muted">Agent RERA {partner.agentRera}</span>}
            <DemoTag />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <BookVisitButton item={item} />
          <ShortlistButton item={item} />
        </div>
      </header>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {facts.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-raised p-3.5">
            <dt className="text-[12px] text-muted">{label}</dt>
            <dd className="mt-0.5 font-mono text-[14.5px] font-medium tabular">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-[18px] pt-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="grid gap-4 rounded-[22px] border border-line bg-raised p-4" aria-labelledby="plan-h">
          <h2 id="plan-h" className="text-base font-bold">
            Floor plan
          </h2>
          <FloorPlan rooms={l.rooms} title={`${title} floor plan`} />
          <RoomTable rooms={l.rooms} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] text-muted">Schematic drawn from the room sizes the {partner.type} listed.</p>
            <Link href={`/homes/${l.slug}/walk`} className={`${btn.ghost} ${btn.small}`}>
              <CubeIcon /> Walk it with the real sun
            </Link>
          </div>
        </section>
        {rent ? (
          <section className="rounded-[22px] border border-line bg-raised p-5" aria-labelledby="cost-h">
            <h2 id="cost-h" className="mb-3 text-base font-bold">
              What renting it costs
            </h2>
            <dl className="grid gap-2 text-[14px]">
              {[
                ["Rent", l.pricePaise, "a month"],
                ["Maintenance", l.maintenancePaisePerMonth, "a month"],
                ["Deposit (refundable)", l.depositPaise ?? 0, "once"],
              ].map(([label, v, when]) => (
                <div key={label as string} className="flex justify-between border-b border-line pb-2">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-mono tabular">
                    {formatINR(v as number, { compact: false })} <span className="font-sans text-[12px] text-muted">{when}</span>
                  </dd>
                </div>
              ))}
              <div className="flex justify-between pt-1">
                <dt className="font-semibold">To move in</dt>
                <dd className="font-mono font-medium tabular">{formatINR((l.depositPaise ?? 0) + l.pricePaise + l.maintenancePaisePerMonth, { compact: false })}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-semibold">First {l.minLeaseMonths} months</dt>
                <dd className="font-mono font-medium tabular">{formatINR((l.pricePaise + l.maintenancePaisePerMonth) * (l.minLeaseMonths ?? 11), { compact: false })}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[12px] text-muted">Move-in is deposit plus the first month&apos;s rent and maintenance. Stamp duty on the rent agreement and any brokerage are extra; agree brokerage in writing first.</p>
          </section>
        ) : (
          <section className="rounded-[22px] border border-line bg-raised p-5" aria-labelledby="emi-h">
            <h2 id="emi-h" className="mb-3 text-base font-bold">
              EMI
            </h2>
            <EmiCalculator pricePaise={l.pricePaise} />
          </section>
        )}
      </div>

      <section className="grid gap-[18px] pt-12 md:grid-cols-2" aria-label="Location and seller">
        <LocationPanel location={l.location} cityId={city.id} locality={loc} />
        <div className="grid content-start gap-3 rounded-[22px] border border-line bg-raised p-5">
          <h2 className="text-base font-bold">{partner.type === "owner" ? "Owner" : "Broker"}</h2>
          <PartnerLine {...partner} />
          {partner.type === "owner" ? (
            <p className="text-[13.5px] text-muted">
              Listed by the owner{partner.verified ? ", whose phone number and ownership documents were checked" : ". Ownership documents are still being checked"}. Owners don&apos;t have public profiles.
            </p>
          ) : (
            <>
              <p className="text-[13.5px] text-muted">
                Agent RERA {partner.agentRera}. Working since {partner.since}. {listingsByPartner(partner.id).length} listings on Vybe.
              </p>
              <Link href={`/partners/${partner.id}`} className="inline-flex items-center gap-1 text-[13.5px] font-bold text-accent-strong">
                All listings by {partner.name} <ArrowIcon className="size-3.5" />
              </Link>
            </>
          )}
        </div>
      </section>

      {similar.length > 0 && (
        <section className="pt-12" aria-labelledby="similar-h">
          <h2 id="similar-h" className="mb-4 font-display text-[clamp(22px,3vw,30px)] font-bold tracking-tight">
            Similar {rent ? "rentals" : "homes"} in {city.name}
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
        <ReportProblem target={`listing:${l.slug}`} />
      </div>
    </div>
  );
}
