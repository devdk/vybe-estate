import { getCity, getPartner, listPartners, partnerCards } from "@vybe/core/catalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ListingCard } from "@/components/ListingCard";
import { CheckIcon, DemoTag, Eyebrow } from "@/components/ui";

type Props = { params: Promise<{ id: string }> };

/** Owners are private individuals: they get no public profile page. */
const publicPartner = (id: string) => {
  const p = getPartner(id);
  return p && p.type !== "owner" ? p : undefined;
};

export function generateStaticParams() {
  return listPartners()
    .filter((p) => p.type !== "owner")
    .map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = publicPartner((await params).id);
  return p ? { title: `${p.name}: ${p.type === "developer" ? "projects" : "listings"} on Vybe`, alternates: { canonical: `/partners/${p.id}` } } : {};
}

export default async function PartnerPage({ params }: Props) {
  const partner = publicPartner((await params).id);
  if (!partner) notFound();
  const city = getCity(partner.cityId)!;
  const cards = partnerCards(partner.id);
  const dev = partner.type === "developer";
  const flats = cards.reduce((n, c) => n + (c.available ?? 0), 0);

  return (
    <div className="mx-auto max-w-[1260px] px-4 pt-7">
      <Breadcrumbs items={[{ label: city.name, href: `/${city.id}` }, { label: partner.name }]} />
      <header className="mt-3">
        <Eyebrow>{dev ? "Developer" : "Broker"} · {city.region}</Eyebrow>
        <h1 className="mt-2 font-display text-[clamp(28px,3.6vw,44px)] font-bold leading-[1.05] tracking-tight">{partner.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[13.5px]">
          {partner.verified && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-avail/12 px-2.5 py-1 font-semibold text-avail-ink">
              <CheckIcon className="size-3.5" /> Verified: {dev ? "company KYC and project RERA checked" : "KYC and agent RERA checked"}
            </span>
          )}
          {partner.agentRera && <span className="font-mono text-[12px] text-muted">Agent RERA {partner.agentRera}</span>}
          <DemoTag />
        </div>
      </header>

      <dl className="mt-6 grid max-w-[720px] grid-cols-3 gap-3">
        <div className="rounded-2xl border border-line bg-raised p-3.5">
          <dt className="text-[12.5px] text-muted">{dev ? "Building since" : "Working since"}</dt>
          <dd className="font-display text-2xl tabular">{partner.since}</dd>
        </div>
        <div className="rounded-2xl border border-line bg-raised p-3.5">
          <dt className="text-[12.5px] text-muted">{dev ? "Projects on Vybe" : "Listings on Vybe"}</dt>
          <dd className="font-display text-2xl tabular">{cards.length}</dd>
        </div>
        <div className="rounded-2xl border border-line bg-raised p-3.5">
          <dt className="text-[12.5px] text-muted">{dev ? "Flats available" : "City"}</dt>
          <dd className="font-display text-2xl tabular">{dev ? flats : city.name}</dd>
        </div>
      </dl>

      <section className="pt-10" aria-labelledby="live-h">
        <h2 id="live-h" className="mb-4 font-display text-[clamp(22px,3vw,30px)] font-bold tracking-tight">
          {dev ? "Projects" : "Listings"}
        </h2>
        {cards.length ? (
          <ul className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <li key={c.id}>
                <ListingCard card={c} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Nothing live right now.</p>
        )}
      </section>

      <section className="pt-10" aria-labelledby="reviews-h">
        <h2 id="reviews-h" className="mb-2 text-lg font-bold">
          Reviews
        </h2>
        <p className="max-w-[60ch] text-muted">No reviews yet. Only buyers who completed a site visit booked through Vybe can review a {dev ? "developer" : "broker"}, so every review comes from someone who met them.</p>
      </section>
    </div>
  );
}
