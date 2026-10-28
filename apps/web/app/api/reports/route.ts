import { randomBytes } from "node:crypto";
import { getListing, getProject } from "@vybe/core/catalog";
import { NextResponse } from "next/server";
import { REPORT_REASONS } from "@/lib/report-reasons";

// Demo store: reports live in memory until the Trust module's `reports` table is wired up.
const reports = new Map<string, { target: string; reason: string; details: string; createdAt: string }>();

export async function POST(req: Request) {
  let body: { target?: unknown; reason?: unknown; details?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send the report as JSON." }, { status: 400 });
  }
  const target = typeof body.target === "string" ? body.target : "";
  const [kind, slug] = target.split(":");
  const exists = kind === "project" ? !!getProject(slug ?? "") : kind === "listing" ? !!getListing(slug ?? "") : false;
  if (!exists) return NextResponse.json({ error: "That listing could not be found." }, { status: 404 });
  if (!REPORT_REASONS.some((r) => r.id === body.reason)) return NextResponse.json({ error: "Pick what is wrong." }, { status: 422 });
  const details = typeof body.details === "string" ? body.details.trim().slice(0, 1000) : "";
  const reference = `RP-${randomBytes(3).toString("hex").toUpperCase()}`;
  reports.set(reference, { target, reason: body.reason as string, details, createdAt: new Date().toISOString() });
  return NextResponse.json({ reference }, { status: 201 });
}
