const trim = (n: number, digits: number) => String(Number(n.toFixed(digits)));

/** ₹ in Indian units: "₹1.25 Cr", "₹85 L", "₹45,000". */
export function formatINR(paise: number, { compact = true }: { compact?: boolean } = {}): string {
  const rupees = paise / 100;
  if (compact && rupees >= 1e7) return `₹${trim(rupees / 1e7, 2)} Cr`;
  if (compact && rupees >= 1e5) return `₹${trim(rupees / 1e5, 1)} L`;
  return `₹${Math.round(rupees).toLocaleString("en-IN")}`;
}

export function formatINRRange(fromPaise: number, toPaise: number): string {
  if (fromPaise === toPaise) return formatINR(fromPaise);
  return `${formatINR(fromPaise)} – ${formatINR(toPaise)}`;
}

export function formatSqft(sqft: number): string {
  return `${Math.round(sqft).toLocaleString("en-IN")} sq ft`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "ready" → "Ready to move"; "2028-06" → "Jun 2028". */
export function formatPossession(possession: string): string {
  if (possession === "ready") return "Ready to move";
  const [y, m] = possession.split("-");
  return `${MONTHS[Number(m) - 1] ?? ""} ${y}`.trim();
}

export function formatBhk(bhk: number): string {
  return `${bhk} BHK`;
}

const FACING_NAMES = { N: "North", NE: "North-east", E: "East", SE: "South-east", S: "South", SW: "South-west", W: "West", NW: "North-west" } as const;

export function formatFacing(f: keyof typeof FACING_NAMES): string {
  return `${FACING_NAMES[f]} facing`;
}

export function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${s}`;
}
