import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { validateVisitRequest, type VisitRequest } from "@/lib/visit-request";

// Demo store: requests live in memory until the Demand module (leads,
// lead_events, site_visits in Postgres) and partner notifications exist.
const requests = new Map<string, VisitRequest & { createdAt: string }>();

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send the visit details as JSON." }, { status: 400 });
  }
  const result = validateVisitRequest(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
  const reference = `VV-${randomBytes(3).toString("hex").toUpperCase()}`;
  requests.set(reference, { ...result.value, createdAt: new Date().toISOString() });
  // Only what the buyer needs back; the phone number is never echoed.
  return NextResponse.json({ reference, date: result.value.date, stops: result.value.stops }, { status: 201 });
}
