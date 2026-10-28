import type { Metadata } from "next";
import { LoanPlanner } from "@/components/LoanPlanner";

export const metadata: Metadata = {
  title: "Home loan EMI calculator",
  description: "Monthly EMI, total interest and year-by-year repayment for a home loan in India, plus how much you can borrow on your take-home pay.",
  alternates: { canonical: "/home-loan-emi-calculator" },
};

export default function EmiPage() {
  return (
    <div className="mx-auto max-w-[1260px] px-4 pt-7">
      <h1 className="font-display text-[clamp(28px,3.6vw,42px)] font-bold tracking-tight">Home loan EMI calculator</h1>
      <p className="mt-2 max-w-[62ch] text-muted">Work out the monthly instalment for a home, how much of each year&apos;s EMIs goes to interest, and what price range your pay supports.</p>
      <div className="mt-6">
        <LoanPlanner />
      </div>
      <section className="mt-10 max-w-[72ch] text-[14.5px] leading-relaxed" aria-labelledby="how-h">
        <h2 id="how-h" className="text-lg font-bold">
          How the EMI is worked out
        </h2>
        <p className="mt-2">
          Home loans in India are usually on a reducing balance: each month&apos;s interest is charged only on what you still owe. The EMI stays the same, so early EMIs are mostly interest and later
          ones mostly principal. The formula is EMI = P × r × (1 + r)<sup>n</sup> ÷ ((1 + r)<sup>n</sup> − 1), where P is the loan, r the monthly rate and n the number of months.
        </p>
        <p className="mt-2">Most home loans in India have a floating rate, so the EMI or the tenure changes when the lender&apos;s rate changes.</p>
      </section>
    </div>
  );
}
