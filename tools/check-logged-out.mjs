#!/usr/bin/env node
// Release gate: every project and listing page shows price, floor plan and
// RERA status in its server HTML, with no cookies, login or phone number.
// Usage: BASE_URL=http://localhost:3100 node tools/check-logged-out.mjs
const BASE = (process.env.BASE_URL ?? "http://localhost:3100").replace(/\/$/, "");
const MARKERS = ['data-testid="price"', 'data-testid="floor-plan"', 'data-testid="rera"'];

const sitemap = await fetch(`${BASE}/sitemap.xml`).then((r) => {
  if (!r.ok) throw new Error(`sitemap.xml returned ${r.status}`);
  return r.text();
});
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => new URL(m[1]).pathname)
  .filter((p) => (p.startsWith("/projects/") || p.startsWith("/homes/")) && !p.includes("/walk"));

if (urls.length === 0) {
  console.error("No project or listing URLs in the sitemap.");
  process.exit(1);
}

const failures = [];
const queue = [...urls];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    for (let path = queue.shift(); path; path = queue.shift()) {
      const res = await fetch(`${BASE}${path}`, { redirect: "manual", headers: { cookie: "" } });
      if (res.status !== 200) {
        failures.push(`${path}: HTTP ${res.status}`);
        continue;
      }
      const html = await res.text();
      const missing = MARKERS.filter((m) => !html.includes(m));
      if (missing.length) failures.push(`${path}: missing ${missing.join(", ")}`);
    }
  }),
);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`check-logged-out: ${urls.length} pages show price, floor plan and RERA without signing in`);
