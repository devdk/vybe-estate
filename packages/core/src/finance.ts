/** Monthly EMI on a reducing-balance home loan, in paise. */
export function monthlyEmi(principalPaise: number, annualRatePct: number, years: number): number {
  const n = Math.round(years * 12);
  if (principalPaise <= 0 || n <= 0) return 0;
  const r = annualRatePct / 1200;
  if (r === 0) return Math.round(principalPaise / n);
  const f = (1 + r) ** n;
  return Math.round((principalPaise * r * f) / (f - 1));
}

export function loanSummary(principalPaise: number, annualRatePct: number, years: number) {
  const emi = monthlyEmi(principalPaise, annualRatePct, years);
  const totalPaid = emi * Math.round(years * 12);
  return { emi, totalPaid, totalInterest: Math.max(0, totalPaid - principalPaise) };
}

/** Year-by-year split of a loan: what each year's EMIs pay off and what is left. */
export function amortizationByYear(principalPaise: number, annualRatePct: number, years: number) {
  const emi = monthlyEmi(principalPaise, annualRatePct, years);
  const r = annualRatePct / 1200;
  let balance = principalPaise;
  const rows: { year: number; principal: number; interest: number; balance: number }[] = [];
  for (let y = 1; y <= Math.round(years); y++) {
    let principal = 0;
    let interest = 0;
    for (let m = 0; m < 12 && balance > 0; m++) {
      const i = balance * r;
      const p = Math.min(balance, emi - i);
      interest += i;
      principal += p;
      balance -= p;
    }
    rows.push({ year: y, principal: Math.round(principal), interest: Math.round(interest), balance: Math.max(0, Math.round(balance)) });
  }
  return rows;
}

/** Largest loan whose EMI fits the given monthly amount (inverse of monthlyEmi). */
export function loanForEmi(emiPaise: number, annualRatePct: number, years: number): number {
  const n = Math.round(years * 12);
  if (emiPaise <= 0 || n <= 0) return 0;
  const r = annualRatePct / 1200;
  if (r === 0) return Math.round(emiPaise * n);
  return Math.round((emiPaise * (1 - (1 + r) ** -n)) / r);
}

/**
 * Under the RERA Act (s.13) a promoter may not take more than 10% of the cost
 * before a registered agreement for sale, so the token is capped well below it.
 */
export const TOKEN_CAP_SHARE = 0.02;

export function tokenAmountPaise(unitPricePaise: number): number {
  const raw = unitPricePaise * TOKEN_CAP_SHARE;
  const step = 10_000_00; // round to ₹10,000
  return Math.min(Math.max(Math.round(raw / step) * step, 50_000_00), 5_00_000_00);
}
