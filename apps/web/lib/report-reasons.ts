export const REPORT_REASONS = [
  { id: "price", label: "The price is wrong" },
  { id: "gone", label: "It is already sold or rented" },
  { id: "photos", label: "Photos or plan don't match the home" },
  { id: "rera", label: "RERA number is wrong or missing" },
  { id: "money", label: "Someone asked for money before a visit" },
  { id: "other", label: "Something else" },
] as const;
