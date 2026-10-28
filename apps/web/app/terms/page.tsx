import type { Metadata } from "next";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "Terms of use", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <Prose
      title="Terms of use"
      intro="The rules for using Vybe Estate as a buyer or renter."
      notice="Draft for legal review. These terms are not yet in force and will be finalised with counsel, including the rules for refundable tokens, before launch."
    >
      <section>
        <h2>What Vybe is</h2>
        <p>
          Vybe is a marketplace. Developers, brokers and owners list homes; Vybe shows them, checks partners and listings as described on the verification page, and passes your visit requests on. Vybe
          is not a party to any sale or rental agreement between you and a seller.
        </p>
      </section>
      <section>
        <h2>Listings</h2>
        <ul>
          <li>Sellers are responsible for what they list: price, areas, possession date, RERA registration and photos.</li>
          <li>Vybe checks what it can before a listing goes live but cannot guarantee every detail. Check the RERA registration and the documents yourself before you pay or sign anything.</li>
          <li>Floor plans drawn by Vybe from room sizes are schematic. Sun positions are calculated, not measured on site.</li>
          <li>EMI and affordability figures are estimates for planning. Your lender decides the actual loan.</li>
        </ul>
      </section>
      <section>
        <h2>Using the site</h2>
        <ul>
          <li>Use your own name and a mobile number you control when booking visits.</li>
          <li>Do not scrape the site, copy listings or photos, or use it to contact sellers for anything other than a genuine enquiry.</li>
          <li>Do not post false reports about a listing or a seller.</li>
        </ul>
      </section>
      <section>
        <h2>Refundable tokens</h2>
        <p>Token payments are not available yet. Their terms, including the hold period and refund timing, will be added here before they go live.</p>
      </section>
      <section>
        <h2>Changes and contact</h2>
        <p>If these terms change, the change will be shown on the site before it applies. Contact details will be published here before launch.</p>
      </section>
    </Prose>
  );
}
