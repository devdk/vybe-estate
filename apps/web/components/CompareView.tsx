"use client";

import { formatFacing, formatINR, formatPossession, formatSqft, layoutPlan, monthlyEmi } from "@vybe/core";
import type { CompareRow } from "@vybe/core/catalog";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useShortlist } from "@/lib/store";
import { FloorPlan } from "./FloorPlan";
import { PartnerLine, btn, chip } from "./ui";

const MAX = 3;
const price = (r: CompareRow) => (r.isRent ? `${formatINR(r.pricePaise, { compact: false })}/month` : `${r.kind === "project" ? "From " : ""}${formatINR(r.pricePaise)}`);
/** A project's figures are "from" values, so it never wins a like-for-like row. */
const exact = (r: CompareRow, n: number | null) => (r.kind === "project" ? null : n);

type Line = { label: string; value: (r: CompareRow) => React.ReactNode; best?: { score: (r: CompareRow) => number | null; word: string } };

const LINES: Line[] = [
  { label: "Price", value: price, best: { score: (r) => exact(r, r.isRent ? null : -r.pricePaise), word: "Lowest" } },
  { label: "Price per sq ft", value: (r) => (r.psfPaise ? formatINR(r.psfPaise, { compact: false }) : "–"), best: { score: (r) => exact(r, r.psfPaise ? -r.psfPaise : null), word: "Lowest" } },
  { label: "Carpet area", value: (r) => (r.carpetSqft === r.carpetMaxSqft ? formatSqft(r.carpetSqft) : `${r.carpetSqft}–${formatSqft(r.carpetMaxSqft)}`), best: { score: (r) => exact(r, r.carpetSqft), word: "Largest" } },
  { label: "Type", value: (r) => r.bhk },
  { label: "Floor", value: (r) => r.floor },
  { label: "Facing", value: (r) => (r.facing ? formatFacing(r.facing) : "Depends on the flat") },
  { label: "Possession", value: (r) => formatPossession(r.possession) },
  { label: "Maintenance", value: (r) => `${formatINR(r.maintenancePaisePerMonth, { compact: false })}/month`, best: { score: (r) => exact(r, -r.maintenancePaisePerMonth), word: "Lowest" } },
  { label: "Parking", value: (r) => `${r.parking} covered` },
  { label: "Deposit", value: (r) => (r.depositPaise ? formatINR(r.depositPaise, { compact: false }) : "–") },
  { label: "EMI (80% loan, 8.5%, 20 years)", value: (r) => (r.isRent ? "–" : `${formatINR(monthlyEmi(r.pricePaise * 0.8, 8.5, 20), { compact: false })}/month`) },
  { label: "Locality", value: (r) => `${r.localityName}, ${r.cityName}` },
  { label: "Locality vibe score", value: (r) => r.vibe.toFixed(1), best: { score: (r) => r.vibe, word: "Highest" } },
  { label: "RERA", value: (r) => <span className="font-mono text-[12px]">{r.rera ?? "Not in a RERA project"}</span> },
  { label: "Seller", value: (r) => <PartnerLine {...r.partner} /> },
];

export function CompareView() {
  const items = useShortlist((s) => s.items);
  const [hydrated, setHydrated] = useState(false);
  const [picked, setPicked] = useState<string[] | null>(null);
  const [rows, setRows] = useState<CompareRow[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const done = () => setHydrated(true);
    if (useShortlist.persist.hasHydrated()) done();
    return useShortlist.persist.onFinishHydration(done);
  }, []);

  const keys = useMemo(() => (picked ?? items.slice(0, MAX).map((i) => i.key)).filter((k) => items.some((i) => i.key === k)), [picked, items]);

  useEffect(() => {
    if (!keys.length) return setRows([]);
    let live = true;
    fetch(`/api/compare?keys=${encodeURIComponent(keys.join(","))}`)
      .then((r) => r.json())
      .then((d: { rows: CompareRow[] }) => live && (setRows(d.rows), setError(false)))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [keys]);

  if (!hydrated) return <p className="mt-8 text-muted">Loading your shortlist…</p>;

  if (items.length < 2)
    return (
      <div className="mt-8 rounded-[20px] border border-dashed border-line px-6 py-10 text-center">
        <p className="text-lg font-bold">{items.length === 0 ? "Your shortlist is empty." : "One home saved. Add another to compare."}</p>
        <p className="mt-1 text-muted">Shortlist flats from a project&apos;s tower explorer or from resale and rental pages, then come back here.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link href="/mumbai" className={`${btn.ghost} ${btn.small}`}>
            Browse Mumbai
          </Link>
          <Link href="/shortlist" className={`${btn.ghost} ${btn.small}`}>
            Open the shortlist
          </Link>
        </div>
      </div>
    );

  const toggle = (key: string) => setPicked(keys.includes(key) ? keys.filter((k) => k !== key) : keys.length < MAX ? [...keys, key] : keys);
  const ordered = keys.map((k) => rows.find((r) => r.key === k)).filter((r): r is CompareRow => !!r);
  const plans = ordered.map((r) => (r.rooms ? layoutPlan(r.rooms) : null));
  const widest = Math.max(1, ...plans.map((p) => p?.width ?? 0));
  const mixed = new Set(ordered.map((r) => r.isRent)).size > 1;

  const bestKey = (line: Line) => {
    if (!line.best) return null;
    const scored = ordered.map((r) => ({ k: r.key, s: line.best!.score(r) })).filter((x): x is { k: string; s: number } => x.s !== null);
    if (scored.length < 2) return null;
    const top = Math.max(...scored.map((x) => x.s));
    const winners = scored.filter((x) => x.s === top);
    return winners.length === 1 ? winners[0]!.k : null;
  };

  return (
    <div className="mt-6 grid gap-6">
      <fieldset>
        <legend className="mb-2 text-[13.5px] text-muted">Pick up to three from your shortlist</legend>
        <div className="flex flex-wrap gap-2">
          {items.map((i) => (
            <button key={i.key} type="button" aria-pressed={keys.includes(i.key)} disabled={!keys.includes(i.key) && keys.length >= MAX} onClick={() => toggle(i.key)} className={clsx(chip(keys.includes(i.key)), "disabled:opacity-40")}>
              {i.title}
            </button>
          ))}
        </div>
      </fieldset>

      {error && <p role="alert" className="rounded-lg bg-accent-soft px-3 py-2 text-accent-strong">Could not load the details. Check your connection and try again.</p>}
      {mixed && <p className="text-[13px] text-muted">You are comparing homes to buy with homes to rent, so prices are not like for like.</p>}

      {ordered.length > 0 && (
        <div className="overflow-x-auto rounded-[22px] border border-line bg-raised">
          <table className="w-full min-w-[640px] text-[13.5px]">
            <thead>
              <tr>
                <th className="w-48 px-4 py-3" />
                {ordered.map((r) => (
                  <th key={r.key} scope="col" className="px-4 py-3 text-left align-bottom">
                    <Link href={r.href} className="text-[15px] font-bold hover:text-accent-strong">
                      {r.title}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LINES.map((line) => {
                const best = bestKey(line);
                return (
                  <tr key={line.label} className="border-t border-line">
                    <th scope="row" className="px-4 py-2.5 text-left font-normal text-muted">
                      {line.label}
                    </th>
                    {ordered.map((r) => (
                      <td key={r.key} className="px-4 py-2.5 align-top font-mono tabular">
                        <span className="font-sans">{line.value(r)}</span>
                        {best === r.key && <span className="ml-2 rounded bg-avail/15 px-1.5 py-0.5 font-sans text-[11px] font-semibold text-avail-ink">{line.best!.word}</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
              <tr className="border-t border-line">
                <th scope="row" className="px-4 py-3 text-left align-top font-normal text-muted">
                  Floor plan
                  <span className="mt-1 block text-[11.5px]">Drawn to the same scale</span>
                </th>
                {ordered.map((r, i) => {
                  const plan = plans[i];
                  return (
                    <td key={r.key} className="px-4 py-3 align-top">
                      {plan && r.rooms ? (
                        <div style={{ width: `${(plan.width / widest) * 100}%` }}>
                          <FloorPlan rooms={r.rooms} title={`${r.title} floor plan`} />
                        </div>
                      ) : (
                        <span className="text-muted">Pick a flat in the tower explorer to see its plan.</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[12px] text-muted">EMI uses an assumed 8.5% rate for comparison only; check your bank&apos;s rate. &ldquo;Lowest&rdquo; and &ldquo;Largest&rdquo; mark the best value in a row when one home clearly leads.</p>
    </div>
  );
}
