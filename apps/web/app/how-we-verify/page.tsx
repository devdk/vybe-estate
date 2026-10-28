import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "How we verify partners and listings", alternates: { canonical: "/how-we-verify" } };

export default function VerifyPage() {
  return (
    <Prose
      title="How we verify partners and listings"
      intro="What has to be true before a developer, broker or owner can publish on Vybe, and what happens when something on a listing is wrong."
      notice="In this demonstration build, partners and listings are invented and these checks are not connected yet. This page describes how they run at launch."
    >
      <section>
        <h2>Developers</h2>
        <ul>
          <li>Company PAN and GSTIN are checked when the developer signs up.</li>
          <li>Every project needs a RERA registration number, checked with the state&apos;s RERA authority. Where the state requires registration, a project without a valid number stays hidden.</li>
          <li>The RERA number appears on the project page, on every listing card and in every advert.</li>
          <li>Prices come from the developer&apos;s price list. When it changes, the old version is kept, so price history can be checked.</li>
        </ul>
      </section>
      <section>
        <h2>Brokers and channel partners</h2>
        <ul>
          <li>PAN and, where they have one, GSTIN are checked.</li>
          <li>Brokers must give their RERA agent registration number, which is shown on their profile and their listings.</li>
        </ul>
      </section>
      <section>
        <h2>Owners</h2>
        <ul>
          <li>The owner&apos;s phone number is confirmed with a one-time code.</li>
          <li>Ownership documents are checked before the listing goes live. They are never shown to buyers.</li>
          <li>Owners do not get a public profile; buyers see a first name and initial only.</li>
        </ul>
      </section>
      <section>
        <h2>Photos and videos</h2>
        <ul>
          <li>Every upload is compared with every photo already on Vybe, to catch pictures copied from another listing or reused across flats.</li>
          <li>The date and place a photo was taken are checked against the listing. Old photos, or photos taken far from the home, are flagged.</li>
          <li>Artist&apos;s impressions are labelled as such. Virtually staged rooms are labelled and shown next to the empty-room original.</li>
          <li>A moderator reviews a sample of each partner&apos;s first listings before they go live.</li>
        </ul>
      </section>
      <section>
        <h2>Duplicates</h2>
        <p>When several brokers list the same flat, the listings are grouped so you see it once, with every broker who can show it.</p>
      </section>
      <section>
        <h2>Reviews</h2>
        <p>Only buyers who completed a site visit booked through Vybe can review the developer or broker they met.</p>
      </section>
      <section>
        <h2>When something is wrong</h2>
        <p>
          Every listing has a &ldquo;Report a problem&rdquo; link for a wrong price, a flat that has already gone, photos that don&apos;t match, or a seller asking for money before a visit. Reports go to the
          moderation team, who can pause the listing while they check. Never pay anyone before you have visited a home and checked its RERA registration yourself.
        </p>
        <p>
          <Link href="/help" className="font-semibold text-accent-strong">
            Questions about buying or renting on Vybe
          </Link>
        </p>
      </section>
    </Prose>
  );
}
