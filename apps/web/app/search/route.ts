import { getCity } from "@vybe/core/catalog";
import { NextResponse, type NextRequest } from "next/server";

/** The home-page search form posts here (GET) so it works without JavaScript. */
export function GET(req: NextRequest) {
  const params = new URLSearchParams(req.nextUrl.searchParams);
  const city = getCity(params.get("city") ?? "")?.id ?? "mumbai";
  params.delete("city");
  for (const [k, v] of [...params]) if (!v) params.delete(k);
  const q = params.toString();
  return NextResponse.redirect(new URL(`/${city}${q ? `?${q}` : ""}#results`, req.url), 303);
}
