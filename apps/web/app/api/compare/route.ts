import { compareRow } from "@vybe/core/catalog";
import { NextResponse, type NextRequest } from "next/server";

/** Facts for up to three shortlisted homes, by shortlist key. Public catalogue data only. */
export function GET(req: NextRequest) {
  const keys = (req.nextUrl.searchParams.get("keys") ?? "").split(",").filter(Boolean).slice(0, 3);
  const rows = keys.map(compareRow).filter((r) => r !== null);
  return NextResponse.json({ rows }, { headers: { "cache-control": "public, max-age=60" } });
}
