"use client";

import { CATEGORIES, RENT_BUDGETS, SALE_BUDGETS, formatINR, type SearchFilters } from "@vybe/core";
import Form from "next/form";
import Link from "next/link";
import { useRef } from "react";
import { btn } from "./ui";

const field = "rounded-full border border-line bg-raised px-3 py-1.5 text-[13.5px] font-semibold";
const YEARS = [2027, 2028, 2029, 2030, 2031];

/**
 * A GET form, so search works without JavaScript; with it, every change
 * navigates client-side and keeps the 3D scene and scroll position.
 */
export function Filters({ cityId, filters, localities }: { cityId: string; filters: SearchFilters; localities: { slug: string; name: string }[] }) {
  const form = useRef<HTMLFormElement>(null);
  // Leave empty fields out of the URL: disabled controls are not submitted.
  const submit = () => {
    const el = form.current;
    if (!el) return;
    const empty = [...el.querySelectorAll<HTMLSelectElement>("select")].filter((s) => !s.value);
    empty.forEach((s) => (s.disabled = true));
    el.requestSubmit();
    empty.forEach((s) => (s.disabled = false));
  };
  const rent = filters.category === "rent";
  const budgets = rent ? RENT_BUDGETS : SALE_BUDGETS;
  return (
    <Form ref={form} action={`/${cityId}`} scroll={false} className="flex flex-wrap items-center gap-2" aria-label="Filter homes" onChange={submit}>
      <label className="sr-only" htmlFor="f-type">
        Category
      </label>
      <select id="f-type" name="type" defaultValue={filters.category ?? ""} className={field}>
        <option value="">Buy · all types</option>
        {CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="f-loc">
        Locality
      </label>
      <select id="f-loc" name="locality" defaultValue={filters.localitySlug ?? ""} className={field}>
        <option value="">All localities</option>
        {localities.map((l) => (
          <option key={l.slug} value={l.slug}>
            {l.name}
          </option>
        ))}
      </select>
      <fieldset className="flex items-center gap-1 rounded-full border border-line bg-raised px-2 py-1">
        <legend className="sr-only">Bedrooms</legend>
        {[1, 2, 3, 4].map((n) => (
          <label key={n} className="cursor-pointer rounded-full px-2 py-0.5 text-[13px] font-semibold has-[:checked]:bg-ink has-[:checked]:text-bg">
            <input type="checkbox" name="bhk" value={n} defaultChecked={filters.bhk?.includes(n)} className="sr-only" />
            {n} BHK
          </label>
        ))}
      </fieldset>
      <label className="sr-only" htmlFor="f-max">
        Maximum budget
      </label>
      <select id="f-max" name="max" defaultValue={filters.maxPaise ? String(filters.maxPaise / 100) : ""} className={field}>
        <option value="">{rent ? "Any rent" : "Any budget"}</option>
        {budgets.map((b) => (
          <option key={b} value={b / 100}>
            Up to {formatINR(b)}
            {rent ? "/month" : ""}
          </option>
        ))}
      </select>
      {!rent && filters.category !== "resale" && (
        <>
          <label className="sr-only" htmlFor="f-pos">
            Possession
          </label>
          <select id="f-pos" name="possession" defaultValue={filters.possessionBy ? String(filters.possessionBy) : ""} className={field}>
            <option value="">Any possession</option>
            <option value="ready">Ready to move</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                By {y}
              </option>
            ))}
          </select>
        </>
      )}
      <label className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-raised px-3 py-1.5 text-[13.5px] font-semibold">
        <input type="checkbox" name="rera" value="1" defaultChecked={filters.reraOnly} className="accent-[var(--accent)]" />
        RERA-registered only
      </label>
      <label className="sr-only" htmlFor="f-sort">
        Sort
      </label>
      <select id="f-sort" name="sort" defaultValue={filters.sort ?? ""} className={field}>
        <option value="">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
        <option value="possession">Possession: soonest</option>
      </select>
      <noscript>
        <button type="submit" className={`${btn.primary} ${btn.small}`}>
          Show homes
        </button>
      </noscript>
      <Link href={`/${cityId}#results`} className="px-2 text-[13px] font-bold text-accent-strong">
        Clear
      </Link>
    </Form>
  );
}
