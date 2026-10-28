import type { Metadata } from "next";
import { CompareView } from "@/components/CompareView";

export const metadata: Metadata = { title: "Compare homes", robots: { index: false } };

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-[1260px] px-4 pt-7">
      <h1 className="font-display text-[clamp(28px,3.6vw,42px)] font-bold tracking-tight">Compare homes</h1>
      <p className="mt-2 max-w-[60ch] text-muted">Price, size, running costs and floor plans side by side, for up to three homes from your shortlist.</p>
      <CompareView />
    </div>
  );
}
