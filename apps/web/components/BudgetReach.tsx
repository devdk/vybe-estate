"use client";

import { formatINR, formatSqft, monthlyEmi, type CityId } from "@vybe/core";
import Link from "next/link";
import { useState } from "react";
import { ArrowIcon, chip } from "./ui";

export interface ReachRow {
  cityId: CityId;
  name: string;
  medianPsfPaise: number;
  /** Locality with the lowest median rate among those with enough homes to be meaningful. */
  cheap: { name: string; slug: string; psfPaise: number } | null;
  /** One entry per budget, in the same order as `budgets`. */
  byBudget: { carpetSqft: number; cheapSqft: number | null; bhk: number | null; results: number }[];
}

const rate = (paise: number) => `${formatINR(paise, { compact: false })}/sq ft`;

/** Space a budget buys in each city at the median asking rate, with the lowest-rate locality alongside. */
export function BudgetReach({ budgets, rows, initial }: { budgets: number[]; rows: ReachRow[]; initial: number }) {
  const [i, setI] = useState(initial);
  const budget = budgets[i]!;
  // One scale for every budget, so the bars grow as the budget does.
  const scale = Math.max(...rows.flatMap((r) => r.byBudget.map((b) => b.cheapSqft ?? b.carpetSqft)));
  const pct = (sqft: number) => `${(sqft / scale) * 100}%`;
  return (
    <section className="pt-14" aria-labelledby="budget-h">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 id="budget-h" className="font-display text-[clamp(22px,3vw,30px)] font-bold tracking-tight">
            What {formatINR(budget)} buys
          </h2>
          <p className="mt-1 text-[13.5px] text-muted">Carpet area at each city&apos;s median asking rate, and in the locality where the rate is lowest.</p>
        </div>
        <div role="group" aria-label="Budget" className="flex flex-wrap gap-2">
          {budgets.map((b, j) => (
            <button key={b} type="button" aria-pressed={j === i} onClick={() => setI(j)} className={chip(j === i)}>
              {formatINR(b)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-[22px] border border-line bg-raised">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 pt-3.5 text-[12.5px] text-muted md:grid md:grid-cols-[10rem_minmax(0,1fr)_8rem] md:gap-x-6">
          <span className="hidden md:block">City, median rate</span>
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-full bg-navy" aria-hidden="true" />
              At the city median
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-full bg-navy/25" aria-hidden="true" />
              In the lowest-rate locality
            </span>
          </span>
          <span className="hidden text-right md:block">Within budget</span>
        </div>
        <ul className="mt-2">
          {rows.map((r) => {
            const b = r.byBudget[i]!;
            return (
              <li key={r.cityId} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-2 border-t border-line px-4 py-3.5 md:grid-cols-[10rem_minmax(0,1fr)_8rem] md:items-center">
                <div>
                  <Link href={`/${r.cityId}`} className="font-semibold hover:text-accent-strong">
                    {r.name}
                  </Link>
                  <span className="block font-mono text-[12px] tabular text-muted">{rate(r.medianPsfPaise)}</span>
                </div>
                <div className="justify-self-end text-[13.5px] md:order-last">
                  {b.results ? (
                    <Link href={`/${r.cityId}?max=${budget / 100}#results`} className="inline-flex items-center gap-1 font-bold text-accent-strong">
                      <span className="font-mono tabular">{b.results}</span> results <ArrowIcon className="size-3.5" />
                    </Link>
                  ) : (
                    <span className="text-muted">None yet</span>
                  )}
                </div>
                <div className="col-span-2 md:col-span-1">
                  <div className="relative h-3 overflow-hidden rounded-full bg-bg" aria-hidden="true">
                    {b.cheapSqft && <div className="absolute inset-y-0 left-0 rounded-full bg-navy/25 transition-[width] duration-[var(--motion-base)] motion-reduce:transition-none" style={{ width: pct(b.cheapSqft) }} />}
                    <div className="absolute inset-y-0 left-0 rounded-full bg-navy transition-[width] duration-[var(--motion-base)] motion-reduce:transition-none" style={{ width: pct(b.carpetSqft) }} />
                  </div>
                  <p className="mt-1.5 text-[13.5px]">
                    <b className="font-mono tabular">{formatSqft(b.carpetSqft)}</b>
                    <span className="text-muted"> · {b.bhk ? `about a ${b.bhk} BHK` : "smaller than a typical 1 BHK"}</span>
                  </p>
                  {r.cheap && b.cheapSqft && (
                    <p className="text-[12.5px] text-muted">
                      <span className="font-mono tabular text-ink">{formatSqft(b.cheapSqft)}</span> in{" "}
                      <Link href={`/${r.cityId}/${r.cheap.slug}`} className="text-ink underline decoration-line underline-offset-2 hover:decoration-ink">
                        {r.cheap.name}
                      </Link>{" "}
                      at <span className="font-mono tabular">{rate(r.cheap.psfPaise)}</span>
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="text-[13.5px]">
          A loan on {formatINR(budget)} with 20% down costs <b className="font-mono tabular">{formatINR(monthlyEmi(budget * 0.8, 8.5, 20), { compact: false })}</b> a month at 8.5% over 20 years.{" "}
          <Link href="/home-loan-emi-calculator" className="inline-flex items-center gap-1 font-bold text-accent-strong">
            Work out your own <ArrowIcon className="size-3.5" />
          </Link>
        </p>
      </div>
      <p className="mt-2 max-w-[90ch] text-[12px] text-muted">
        Median of asking prices per sq ft of RERA carpet area, across available flats in projects and resale homes on Vybe. Rentals are left out. BHK size is the city&apos;s median for that BHK. The lowest-rate locality only counts localities with at least ten homes on sale. Stamp duty, registration and GST are extra.
      </p>
    </section>
  );
}
