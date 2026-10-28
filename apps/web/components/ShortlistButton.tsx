"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useShortlist, type ShortlistItem } from "@/lib/store";
import { HeartIcon, btn } from "./ui";

export function ShortlistButton({ item, className }: { item: ShortlistItem; className?: string }) {
  const saved = useShortlist((s) => s.items.some((i) => i.key === item.key));
  const toggle = useShortlist((s) => s.toggle);
  return (
    <button type="button" aria-pressed={saved} onClick={() => toggle(item)} className={clsx(btn.ghost, saved && "!border-accent !bg-accent-soft", className)}>
      <HeartIcon className={clsx(saved && "fill-accent text-accent")} />
      {saved ? "Shortlisted" : "Add to shortlist"}
    </button>
  );
}

/** Adds to the shortlist (the visit cart) and opens the visit planner. */
export function BookVisitButton({ item, className }: { item: ShortlistItem; className?: string }) {
  const add = useShortlist((s) => s.add);
  const router = useRouter();
  return (
    <button
      type="button"
      className={clsx(btn.primary, className)}
      onClick={() => {
        add(item);
        router.push("/shortlist#plan");
      }}
    >
      Book a site visit
    </button>
  );
}
