// Shared contract for POST /api/visits, validated on the server.
export interface VisitRequest {
  date: string;
  startHour: number;
  name: string;
  phone: string;
  consent: true;
  stops: { key: string; label: string; partnerName: string; start: string; end: string }[];
}

export const INDIAN_MOBILE = /^(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/;

export function validateVisitRequest(body: unknown, today = new Date()): { ok: true; value: VisitRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Send the visit details as JSON." };
  const b = body as Partial<VisitRequest>;
  if (b.consent !== true) return { ok: false, error: "Agree to share your name and number with these partners." };
  if (typeof b.name !== "string" || b.name.trim().length < 2 || b.name.length > 80) return { ok: false, error: "Enter your name." };
  if (typeof b.phone !== "string" || !INDIAN_MOBILE.test(b.phone.trim())) return { ok: false, error: "Enter a 10-digit Indian mobile number." };
  if (typeof b.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) return { ok: false, error: "Pick a date." };
  const day = new Date(`${b.date}T00:00:00`);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 60);
  if (Number.isNaN(day.getTime()) || day < start || day > end) return { ok: false, error: "Pick a date between tomorrow and the next 60 days." };
  if (typeof b.startHour !== "number" || b.startHour < 9 || b.startHour > 16) return { ok: false, error: "Start between 9 am and 4 pm." };
  if (!Array.isArray(b.stops) || b.stops.length === 0 || b.stops.length > 8) return { ok: false, error: "Add between one and eight homes to the visit plan." };
  for (const s of b.stops)
    if (!s || typeof s.key !== "string" || typeof s.label !== "string" || typeof s.partnerName !== "string" || typeof s.start !== "string" || typeof s.end !== "string")
      return { ok: false, error: "The visit plan is incomplete." };
  return { ok: true, value: { ...(b as VisitRequest), name: b.name.trim(), phone: b.phone.trim() } };
}
