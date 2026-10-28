import type { Metadata } from "next";
import { ShortlistView } from "@/components/ShortlistView";

export const metadata: Metadata = { title: "Shortlist and site visits", robots: { index: false } };

export default function ShortlistPage() {
  return (
    <div className="mx-auto max-w-[1260px] px-4 pt-7">
      <h1 className="font-display text-[clamp(28px,3.6vw,42px)] font-bold tracking-tight">Your shortlist</h1>
      <p className="mt-2 max-w-[60ch] text-muted">Saved flats work like a cart: plan one day of site visits across every seller on the list, in the order that wastes the least time in traffic.</p>
      <ShortlistView />
    </div>
  );
}
