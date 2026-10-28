"use client";

import { amortizationByYear, formatINR, loanForEmi, loanSummary } from "@vybe/core";
import { useState } from "react";

const field = "rounded-lg border border-line bg-bg px-2.5 py-1.5 font-mono text-[14px] text-ink";
const LAKH = 1e5 * 100;
const TENURES = [5, 10, 15, 20, 25, 30];

function Num({ label, value, onChange, step = 1, min = 0, suffix }: { label: string; value: number; onChange: (n: number) => void; step?: number; min?: number; suffix?: string }) {
  return (
    <label className="grid gap-1 text-[13px] text-muted">
      {label}
      <span className="flex items-center gap-2">
        <input type="number" inputMode="decimal" min={min} step={step} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(e.target.valueAsNumber)} className={`${field} w-full`} />
        {suffix && <span className="shrink-0 text-ink">{suffix}</span>}
      </span>
    </label>
  );
}

export function LoanPlanner() {
  const [priceLakh, setPriceLakh] = useState(120);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);
  const [pay, setPay] = useState(150_000);
  const [otherEmi, setOtherEmi] = useState(0);
  const [share, setShare] = useState(40);

  const ok = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
  const price = ok(priceLakh) * LAKH;
  const loan = Math.round((price * (100 - Math.min(90, ok(downPct)))) / 100);
  const s = loanSummary(loan, ok(rate), years);
  const rows = amortizationByYear(loan, ok(rate), years);
  const emiRoom = Math.max(0, ((ok(pay) * ok(share)) / 100 - ok(otherEmi)) * 100);
  const maxLoan = loanForEmi(emiRoom, ok(rate), years);
  const maxPrice = downPct < 100 ? Math.round(maxLoan / ((100 - Math.min(90, ok(downPct))) / 100)) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="grid content-start gap-4 rounded-[22px] border border-line bg-raised p-5" aria-labelledby="emi-h">
        <h2 id="emi-h" className="text-lg font-bold">
          EMI for a home
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Num label="Home price" value={priceLakh} onChange={setPriceLakh} step={5} suffix="lakh" />
          <Num label="Down payment" value={downPct} onChange={setDownPct} step={5} suffix="%" />
          <Num label="Interest rate" value={rate} onChange={setRate} step={0.05} suffix="% a year" />
          <label className="grid gap-1 text-[13px] text-muted">
            Tenure
            <select value={years} onChange={(e) => setYears(Number(e.target.value))} className={field}>
              {TENURES.map((y) => (
                <option key={y} value={y}>
                  {y} years
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-3 gap-3 rounded-xl bg-bg p-4" aria-live="polite">
          <div>
            <p className="text-[12.5px] text-muted">Monthly EMI</p>
            <p className="font-display text-xl tabular">{formatINR(s.emi, { compact: false })}</p>
          </div>
          <div>
            <p className="text-[12.5px] text-muted">Loan</p>
            <p className="font-display text-xl tabular">{formatINR(loan)}</p>
          </div>
          <div>
            <p className="text-[12.5px] text-muted">Total interest</p>
            <p className="font-display text-xl tabular">{formatINR(s.totalInterest)}</p>
          </div>
        </div>
        <details className="rounded-xl border border-line">
          <summary className="cursor-pointer px-4 py-2.5 text-[14px] font-semibold">Year-by-year repayment</summary>
          <div className="max-h-[320px] overflow-auto">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-raised">
                <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-4 py-2 font-medium">Year</th>
                  <th className="px-4 py-2 text-right font-medium">Principal</th>
                  <th className="px-4 py-2 text-right font-medium">Interest</th>
                  <th className="px-4 py-2 text-right font-medium">Left to pay</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.year} className="border-t border-line font-mono tabular">
                    <td className="px-4 py-1.5">{r.year}</td>
                    <td className="px-4 py-1.5 text-right">{formatINR(r.principal)}</td>
                    <td className="px-4 py-1.5 text-right">{formatINR(r.interest)}</td>
                    <td className="px-4 py-1.5 text-right">{formatINR(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="grid content-start gap-4 rounded-[22px] border border-line bg-raised p-5" aria-labelledby="afford-h">
        <h2 id="afford-h" className="text-lg font-bold">
          How much can I borrow?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Num label="Take-home pay a month" value={pay} onChange={setPay} step={5000} suffix="₹" />
          <Num label="EMIs you already pay" value={otherEmi} onChange={setOtherEmi} step={1000} suffix="₹" />
          <Num label="Share of pay for all EMIs" value={share} onChange={setShare} step={5} suffix="%" />
        </div>
        <div className="grid grid-cols-3 gap-3 rounded-xl bg-bg p-4" aria-live="polite">
          <div>
            <p className="text-[12.5px] text-muted">EMI you can take on</p>
            <p className="font-display text-xl tabular">{formatINR(emiRoom, { compact: false })}</p>
          </div>
          <div>
            <p className="text-[12.5px] text-muted">Loan at {ok(rate)}%, {years} years</p>
            <p className="font-display text-xl tabular">{formatINR(maxLoan)}</p>
          </div>
          <div>
            <p className="text-[12.5px] text-muted">Home price with {ok(downPct)}% down</p>
            <p className="font-display text-xl tabular">{formatINR(maxPrice)}</p>
          </div>
        </div>
        <p className="text-[12.5px] text-muted">
          Uses the rate, tenure and down payment from the left. Each lender sets its own limit on how much of your pay can go to EMIs, and checks your credit history, so treat this as a starting point.
          Stamp duty, registration and GST on under-construction homes are paid on top of the price.
        </p>
      </section>
    </div>
  );
}
