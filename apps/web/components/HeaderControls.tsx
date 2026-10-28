"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePrefs, useShortlist } from "@/lib/store";
import { useLiteMode } from "@/lib/device";

/** Reads persisted state after mount so server HTML and first paint always match. */
export function StoreHydrator() {
  useEffect(() => {
    void useShortlist.persist.rehydrate();
    void usePrefs.persist.rehydrate();
  }, []);
  return null;
}

export function ShortlistLink() {
  const count = useShortlist((s) => s.items.length);
  return (
    <Link href="/shortlist" className="flex items-center gap-2 rounded-full border border-line bg-raised px-3.5 py-1.5 text-[13px] font-bold">
      Shortlist
      <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-xs text-accent-ink tabular" aria-live="polite">
        {count}
      </span>
    </Link>
  );
}

export function LiteToggle() {
  const lite = useLiteMode();
  const setLite = usePrefs((s) => s.setLite);
  return (
    <button
      type="button"
      onClick={() => setLite(!lite)}
      aria-pressed={lite}
      className="rounded-full border border-line bg-raised px-3 py-1.5 text-[12.5px] font-semibold text-muted aria-pressed:border-ink aria-pressed:text-ink"
    >
      Lite<span className="hidden sm:inline"> mode</span> {lite ? "on" : "off"}
      <span className="sr-only">: maps, plans and tables instead of 3D scenes</span>
    </button>
  );
}
