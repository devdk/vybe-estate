import type { Metadata } from "next";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "Privacy notice", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <Prose
      title="Privacy notice"
      intro="What Vybe Estate collects about buyers and renters, why, who sees it, and how to get it changed or deleted."
      notice="Draft for legal review. This notice is not yet in force and will be finalised with counsel under the Digital Personal Data Protection Act, 2023 before launch."
    >
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            <b>Nothing to browse.</b> You can search, see prices, floor plans and RERA details, and use the calculators without an account or a phone number.
          </li>
          <li>
            <b>Your shortlist and settings</b> are stored in your browser on your device, not on our servers, until you choose to book visits.
          </li>
          <li>
            <b>When you book visits:</b> your name, mobile number, the homes, date and times you picked, and which sellers you agreed to share your details with.
          </li>
          <li>
            <b>When you report a listing:</b> the listing, the reason and anything you write.
          </li>
          <li>
            <b>Technical data:</b> pages viewed and device type, used in aggregate to keep the site fast and working. No advertising trackers.
          </li>
        </ul>
      </section>
      <section>
        <h2>Why we use it</h2>
        <ul>
          <li>To pass your visit request to the sellers you chose, and to let them reach you about those visits.</li>
          <li>To look into reports and keep fake or misleading listings off the site.</li>
          <li>To meet legal duties, for example responding to a lawful request from an authority.</li>
        </ul>
        <p>We rely on your consent for visit requests. You give it per seller, by ticking the box when you book.</p>
      </section>
      <section>
        <h2>Who sees it</h2>
        <ul>
          <li>Only the sellers you picked see your name and number, and only for the visits you booked.</li>
          <li>Service providers that run parts of the site for us (hosting, messaging) process data on our instructions only.</li>
          <li>We do not sell personal data and do not share it with lenders, insurers or other sellers without asking you first.</li>
        </ul>
      </section>
      <section>
        <h2>How long we keep it</h2>
        <p>Visit requests are kept for 12 months after the visit date, then deleted, unless a dispute or legal duty requires us to keep them longer.</p>
      </section>
      <section>
        <h2>Your rights</h2>
        <ul>
          <li>Ask for a summary of the personal data we hold about you and who we shared it with.</li>
          <li>Ask us to correct or delete it.</li>
          <li>Withdraw consent for any seller. They will no longer receive your details; it does not undo what they already received.</li>
          <li>Raise a grievance with our grievance officer, and if you are not satisfied, with the Data Protection Board of India.</li>
        </ul>
        <p>Contact details for the grievance officer will be published here before launch.</p>
      </section>
    </Prose>
  );
}
