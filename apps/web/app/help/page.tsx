import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "Help: buying and renting on Vybe", alternates: { canonical: "/help" } };

const FAQ: { group: string; items: { q: string; a: ReactNode; text: string }[] }[] = [
  {
    group: "Using Vybe",
    items: [
      {
        q: "Does Vybe charge buyers or renters?",
        text: "No. Searching, shortlisting, comparing and booking visits are free. Vybe is paid by developers and brokers. A broker may charge you brokerage on a resale or rental deal; agree it with them in writing before the visit.",
        a: (
          <p>
            No. Searching, shortlisting, comparing and booking visits are free. Vybe is paid by developers and brokers. A broker may charge you brokerage on a resale or rental deal; agree it with them in
            writing before the visit.
          </p>
        ),
      },
      {
        q: "Who sees my phone number?",
        text: "Only the sellers you choose when you book visits, and only after you tick the consent box for them. Nobody else can see it, and you can withdraw consent at any time.",
        a: <p>Only the sellers you choose when you book visits, and only after you tick the consent box for them. Nobody else can see it, and you can withdraw consent at any time.</p>,
      },
      {
        q: "How does booking several visits on one day work?",
        text: "Add homes to your shortlist, open it, pick a date and a start time. Vybe orders the visits so each next stop is the nearest one, with an estimated drive time between them. Each seller then confirms or moves their slot.",
        a: (
          <p>
            Add homes to your <Link href="/shortlist" className="font-semibold text-accent-strong">shortlist</Link>, open it, pick a date and a start time. Vybe orders the visits so each next stop is the
            nearest one, with an estimated drive time between them. Each seller then confirms or moves their slot.
          </p>
        ),
      },
      {
        q: "What is Lite mode?",
        text: "Lite mode shows maps, floor plans and tables instead of 3D scenes. It switches on by itself on phones with little memory, on 2G or with Data Saver on, and you can turn it on or off from the top of any page.",
        a: <p>Lite mode shows maps, floor plans and tables instead of 3D scenes. It switches on by itself on phones with little memory, on 2G or with Data Saver on, and you can turn it on or off from the top of any page.</p>,
      },
    ],
  },
  {
    group: "Reading a listing",
    items: [
      {
        q: "What is carpet area, and how is it different from built-up and super built-up?",
        text: "Carpet area is the usable floor area inside the flat, including internal walls but excluding the outer walls, balconies and open terraces; it is the area RERA requires prices to be based on. Built-up area adds the outer walls and balconies. Super built-up adds a share of common areas such as lobbies, stairs, lifts and the clubhouse. Vybe always quotes carpet area first.",
        a: (
          <>
            <p>
              Carpet area is the usable floor area inside the flat, including internal walls but excluding the outer walls, balconies and open terraces. It is the area RERA requires prices to be based on.
            </p>
            <p>Built-up area adds the outer walls and balconies. Super built-up adds a share of common areas such as lobbies, stairs, lifts and the clubhouse. Vybe always quotes carpet area first.</p>
          </>
        ),
      },
      {
        q: "What do available, on hold, booked and sold mean?",
        text: "Available: you can visit and buy it. On hold: another buyer has paid a refundable token and has a few days to decide. Booked: the buyer has signed with the developer. Sold: the sale is complete. The colours in the tower explorer use the same four states.",
        a: (
          <p>
            Available: you can visit and buy it. On hold: another buyer has paid a refundable token and has a few days to decide. Booked: the buyer has signed with the developer. Sold: the sale is complete.
            The colours in the tower explorer use the same four states.
          </p>
        ),
      },
      {
        q: "How do I check a RERA registration number?",
        text: "Search the number on the website of the state's RERA authority: MahaRERA for Mumbai and Pune, K-RERA for Bengaluru, HRERA for Gurugram, UP RERA for Noida and TG RERA for Hyderabad. The registration shows the promoter, the approved plan and the promised possession date. Check it before you pay anything.",
        a: (
          <p>
            Search the number on the website of the state&apos;s RERA authority: MahaRERA for Mumbai and Pune, K-RERA for Bengaluru, HRERA for Gurugram, UP RERA for Noida and TG RERA for Hyderabad. The
            registration shows the promoter, the approved plan and the promised possession date. Check it before you pay anything.
          </p>
        ),
      },
      {
        q: "How is the vibe score worked out?",
        text: "It is a weighted average of five scores out of 10: commute 30%, schools 20%, green cover 20%, price growth 20% and nightlife 10%. Each factor will show its source and date. In this build the factor scores are placeholders.",
        a: (
          <p>
            It is a weighted average of five scores out of 10: commute 30%, schools 20%, green cover 20%, price growth 20% and nightlife 10%. Each factor will show its source and date. In this build the
            factor scores are placeholders.
          </p>
        ),
      },
      {
        q: "Why is the floor plan a simple drawing?",
        text: "Until the developer or seller uploads their plan, Vybe draws one from the room sizes they listed. Each room has its real area, but the arrangement is schematic. It is enough to check sizes and fit furniture, not to know which room has which window.",
        a: (
          <p>
            Until the developer or seller uploads their plan, Vybe draws one from the room sizes they listed. Each room has its real area, but the arrangement is schematic. It is enough to check sizes and
            fit furniture, not to know which room has which window.
          </p>
        ),
      },
    ],
  },
  {
    group: "Paying",
    items: [
      {
        q: "Can I hold a flat with a token on Vybe?",
        text: "Not yet. Refundable tokens are coming: the flat will show as on hold for an agreed number of days, and the token will be refunded automatically if you don't go ahead. Under the RERA Act a developer cannot take more than 10% of the price before a registered agreement for sale, and the token will be well below that.",
        a: (
          <p>
            Not yet. Refundable tokens are coming: the flat will show as on hold for an agreed number of days, and the token will be refunded automatically if you don&apos;t go ahead. Under the RERA Act a
            developer cannot take more than 10% of the price before a registered agreement for sale, and the token will be well below that.
          </p>
        ),
      },
      {
        q: "Should I pay anyone before a visit?",
        text: "No. Never pay a deposit, visit fee or token to anyone before you have seen the home and checked its RERA registration. If someone asks, use Report a problem on the listing.",
        a: <p>No. Never pay a deposit, visit fee or token to anyone before you have seen the home and checked its RERA registration. If someone asks, use Report a problem on the listing.</p>,
      },
      {
        q: "What costs come on top of the price?",
        text: "Stamp duty and registration charges set by the state, GST on under-construction homes, and any parking or club charges the developer lists separately. Ask for an all-in cost sheet before you sign.",
        a: <p>Stamp duty and registration charges set by the state, GST on under-construction homes, and any parking or club charges the developer lists separately. Ask for an all-in cost sheet before you sign.</p>,
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <Prose title="Help" intro="Answers to the questions buyers and renters ask most.">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.flatMap((g) => g.items).map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.text } })),
        }}
      />
      {FAQ.map((g) => (
        <section key={g.group}>
          <h2>{g.group}</h2>
          {g.items.map((i) => (
            <div key={i.q} className="mt-5">
              <h3>{i.q}</h3>
              <div className="mt-1.5">{i.a}</div>
            </div>
          ))}
        </section>
      ))}
      <section>
        <h2>Something else</h2>
        <p>
          To flag a problem with a listing, use &ldquo;Report a problem&rdquo; on its page. Read{" "}
          <Link href="/how-we-verify" className="font-semibold text-accent-strong">
            how we verify partners and listings
          </Link>{" "}
          and the{" "}
          <Link href="/privacy" className="font-semibold text-accent-strong">
            privacy notice
          </Link>
          .
        </p>
      </section>
    </Prose>
  );
}
