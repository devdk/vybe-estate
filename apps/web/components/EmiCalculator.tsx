"use client";

import { formatINR, loanSummary } from "@vybe/core";
import { useId, useState } from "react";

const TENURES = [10, 15, 20, 25, 30];

export function EmiCalculator({ pricePaise }: { pricePaise: number }) {
  const id = useId();
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);
  const loan = Math.round((pricePaise * (100 - downPct)) / 100);
  const s = loanSummary(loan, Number.isFinite(rate) ? rate : 0, years);
  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <label htmlFor={`${id}-down`} className="flex justify-between text-[13.5px]">
          <span>Down payment</span>
          <span className="font-mono tabular">
            {downPct}% · {formatINR(pricePaise - loan)}
          </span>
        </label>
        <input id={`${id}-down`} type="range" min={10} max={60} step={5} value={downPct} onChange={(e) => setDownPct(Number(e.target.value))} className="accent-[var(--accent)]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-[13px] text-muted">
          Interest rate (% a year)
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={20}
            step={0.05}
            value={rate}
            onChange={(e) => setRate(e.target.valueAsNumber)}
            className="rounded-lg border border-line bg-bg px-2.5 py-1.5 font-mono text-[14px] text-ink"
          />
        </label>
        <label className="grid gap-1 text-[13px] text-muted">
          Tenure
          <select value={years} onChange={(e) => setYears(Number(e.target.value))} className="rounded-lg border border-line bg-bg px-2.5 py-1.5 text-[14px] text-ink">
            {TENURES.map((y) => (
              <option key={y} value={y}>
                {y} years
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="rounded-xl bg-bg p-3.5" aria-live="polite">
        <p className="text-[13px] text-muted">Monthly EMI</p>
        <p className="font-display text-2xl tabular">{formatINR(s.emi, { compact: false })}</p>
        <p className="mt-1 text-[12.5px] text-muted">
          Loan {formatINR(loan)} · total interest {formatINR(s.totalInterest)}
        </p>
      </div>
      <p className="text-[12px] text-muted">The rate is your own input; check your bank&apos;s current home-loan rate. Stamp duty and registration are extra.</p>
    </div>
  );
}
