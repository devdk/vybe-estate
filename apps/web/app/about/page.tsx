import { listCities } from "@vybe/core/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "About Vybe Estate", alternates: { canonical: "/about" } };

export default function AboutPage() {
  const cities = listCities();
  return (
    <Prose title="About Vybe Estate" intro="A property marketplace for new launches, resale homes and rentals in India's five largest housing markets.">
      <section>
        <h2>What you can do here</h2>
        <ul>
          <li>See each city as a 3D map, with neighbourhoods sized by how many homes are for sale and coloured by price per sq ft.</li>
          <li>Open a project&apos;s towers and pick the exact flat, with its floor, facing, price and whether it is still available.</li>
          <li>Check where the sun falls on a flat at any time of year, and whether your furniture fits.</li>
          <li>Compare homes and neighbourhoods side by side, then book visits with several sellers on one day.</li>
        </ul>
      </section>
      <section>
        <h2>Cities</h2>
        <p>
          {cities.map((c, i) => (
            <span key={c.id}>
              {i > 0 && (i === cities.length - 1 ? " and " : ", ")}
              <Link href={`/${c.id}`} className="font-semibold text-accent-strong">
                {c.region}
              </Link>
            </span>
          ))}
          . Together they accounted for {cities.reduce((n, c) => n + c.sales.units, 0).toLocaleString("en-IN")} of the homes sold across India&apos;s top seven cities in July to September 2026 (Anarock).
        </p>
      </section>
      <section>
        <h2>How Vybe makes money</h2>
        <p>Buyers and renters pay nothing to search, shortlist or book visits. Developers and brokers pay for monthly plans and for verified enquiries; owners can pay for a professional photo shoot or a boost.</p>
        <p>Paid placement is always labelled. It never changes a listing&apos;s price, facts or RERA status, and it never hides a cheaper home from your search results.</p>
      </section>
      <section>
        <h2>What we show and what we don&apos;t</h2>
        <ul>
          <li>Price, floor plan and RERA details are visible on every listing without signing in or giving a phone number.</li>
          <li>&ldquo;Only a few left&rdquo; appears only when the live count is that low. There are no countdown timers.</li>
          <li>Every figure on the site shows where it came from and when.</li>
          <li>Photos must be of the actual home. Renders are labelled as artist&apos;s impressions and virtually staged rooms are labelled too.</li>
        </ul>
        <p>
          <Link href="/how-we-verify" className="font-semibold text-accent-strong">
            How we check partners and listings
          </Link>
        </p>
      </section>
      <section>
        <h2>This build</h2>
        <p>
          This is a demonstration build. Projects, partners, prices, flat availability and RERA numbers are invented so the site can be tried end to end; RERA numbers start with &ldquo;DEMO&rdquo;. City sales
          figures are real.
        </p>
      </section>
    </Prose>
  );
}
