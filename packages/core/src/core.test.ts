import { describe, expect, it } from "vitest";
import { compareRow, getProject, listListings, listPartners, listProjects, localityStats, search, similarProjects, suggestAlternatives } from "./catalog";
import { CITIES, LOCALITIES } from "./cities";
import { amortizationByYear, loanForEmi, monthlyEmi, tokenAmountPaise } from "./finance";
import { carpetFromRooms, furnitureFit, layoutPlan, roomArea } from "./floorplan";
import { formatINR, formatPossession } from "./format";
import { layoutPoints } from "./geo";
import { projectSummary, scarcityText } from "./inventory";
import { filtersToQuery, parseFilters } from "./search";
import { compassPoint, istDate, sunlitSides, sunPosition } from "./sun";
import { vibeScore } from "./vibe";
import { planVisitDay } from "./visits";

describe("format", () => {
  it("uses Indian units", () => {
    expect(formatINR(1_25_00_000_00)).toBe("₹1.25 Cr");
    expect(formatINR(85_00_000_00)).toBe("₹85 L");
    expect(formatINR(45_000_00)).toBe("₹45,000");
    expect(formatINR(1_23_45_678_00, { compact: false })).toBe("₹1,23,45,678");
  });
  it("formats possession", () => {
    expect(formatPossession("ready")).toBe("Ready to move");
    expect(formatPossession("2028-06")).toBe("Jun 2028");
  });
});

describe("finance", () => {
  it("matches the standard EMI formula", () => {
    // ₹50 L at 8.5% for 20 years ≈ ₹43,391
    expect(Math.round(monthlyEmi(50_00_000_00, 8.5, 20) / 100)).toBe(43_391);
  });
  it("keeps the token far below the RERA 10% limit", () => {
    for (const price of [40_00_000_00, 1_50_00_000_00, 12_00_00_000_00]) {
      expect(tokenAmountPaise(price)).toBeLessThan(price * 0.1);
    }
  });
});

describe("vibe score", () => {
  it("is a weighted 0–10 score", () => {
    expect(vibeScore({ commute: 10, schools: 10, greenCover: 10, nightlife: 10, appreciation: 10 })).toBe(10);
    expect(vibeScore({ commute: 0, schools: 0, greenCover: 0, nightlife: 10, appreciation: 0 })).toBe(1);
  });
});

describe("demo catalogue", () => {
  it("is deterministic", () => {
    const a = listProjects()[0]!;
    expect(getProject(a.slug)).toEqual(a);
  });
  it("seeds every launch city and category", () => {
    for (const city of CITIES) {
      const cats = new Set([...listProjects(city.id).map((p) => p.category), ...listListings(city.id).map((l) => l.kind)]);
      expect([...cats].sort()).toEqual(["new-launch", "plots-villas", "ready-to-move", "rent", "resale", "under-construction"]);
    }
  });
  it("has unique slugs and unit numbers", () => {
    const slugs = [...listProjects().map((p) => p.slug), ...listListings().map((l) => l.slug)];
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const p of listProjects()) {
      const numbers = p.towers.flatMap((t) => t.units.map((u) => u.number));
      expect(new Set(numbers).size).toBe(numbers.length);
    }
  });
  it("keeps floor-plan rooms consistent with stated carpet area", () => {
    for (const p of listProjects())
      for (const t of p.unitTypes) expect(Math.abs(carpetFromRooms(t.rooms) - t.carpetSqft)).toBeLessThan(1);
  });
  it("stores money as integer paise", () => {
    for (const p of listProjects()) for (const t of p.towers) for (const u of t.units) expect(Number.isInteger(u.pricePaise)).toBe(true);
  });
});

describe("search", () => {
  it("applies budget and BHK to available units only", () => {
    const max = 1_50_00_000_00;
    const cards = search({ cityId: "pune", bhk: [3], maxPaise: max });
    expect(cards.length).toBeGreaterThan(0);
    for (const c of cards) {
      expect(c.priceFromPaise).toBeLessThanOrEqual(max);
      expect(c.priceToPaise).toBeLessThanOrEqual(max);
      expect(c.bhks).toContain(3);
    }
  });
  it("keeps rent out of buy results and in rent results", () => {
    expect(search({ cityId: "mumbai" }).some((c) => c.isRent)).toBe(false);
    const rent = search({ cityId: "mumbai", category: "rent" });
    expect(rent.length).toBeGreaterThan(0);
    expect(rent.every((c) => c.isRent)).toBe(true);
  });
  it("suggests a concrete next step when nothing matches", () => {
    const f = { cityId: "pune" as const, localitySlug: "baner", bhk: [4], maxPaise: 50_00_000_00 };
    expect(search(f)).toHaveLength(0);
    const s = suggestAlternatives(f);
    expect(s.length).toBeGreaterThan(0);
    for (const x of s) expect(search(x.filters).length).toBe(x.count);
  });
  it("round-trips filters through the URL", () => {
    const f = parseFilters("bengaluru", { type: "new-launch", bhk: "2,3", max: "15000000", rera: "1", locality: "whitefield", possession: "2029" });
    expect(f).toMatchObject({ category: "new-launch", bhk: [2, 3], maxPaise: 1_50_00_000_00, reraOnly: true, localitySlug: "whitefield", possessionBy: 2029 });
    expect(parseFilters("bengaluru", Object.fromEntries(new URLSearchParams(filtersToQuery(f))))).toEqual(f);
  });
});

describe("inventory", () => {
  it("only states scarcity from live counts", () => {
    expect(scarcityText(40)).toBeNull();
    expect(scarcityText(3)).toBe("3 units left");
    expect(scarcityText(0)).toBe("All units sold or held");
  });
  it("summarises a project", () => {
    const p = listProjects("hyderabad")[0]!;
    const s = projectSummary(p);
    expect(s.total).toBe(p.towers.reduce((n, t) => n + t.units.length, 0));
    expect(s.counts.available + s.counts.on_hold + s.counts.booked + s.counts.sold).toBe(s.total);
  });
});

describe("geometry", () => {
  it("lays out localities without overlapping markers", () => {
    const pts = LOCALITIES.filter((l) => l.cityId === "mumbai").map((l) => l.center);
    const { positions, markerRadius } = layoutPoints(pts, 6);
    for (let i = 0; i < positions.length; i++)
      for (let j = i + 1; j < positions.length; j++)
        expect(Math.hypot(positions[i]!.x - positions[j]!.x, positions[i]!.y - positions[j]!.y)).toBeGreaterThan(markerRadius * 2);
  });
  it("keeps each room's area in the schematic plan", () => {
    const rooms = listProjects()[0]!.unitTypes[0]!.rooms;
    const plan = layoutPlan(rooms);
    plan.rooms.forEach((r, i) => expect(r.w * r.h).toBeCloseTo(roomArea(rooms[i]!), 6));
  });
  it("gives every locality stats", () => {
    for (const c of CITIES) for (const s of localityStats(c.id)) expect(s.homes).toBeGreaterThan(0);
  });
});

describe("visit planner", () => {
  it("orders stops nearest-first and never overlaps", () => {
    const plan = planVisitDay([
      { id: "a", label: "A", partnerName: "P", location: [73.738, 18.5912] },
      { id: "b", label: "B", partnerName: "Q", location: [73.941, 18.5515] },
      { id: "c", label: "C", partnerName: "R", location: [73.7629, 18.5986] },
    ]);
    expect(plan.map((p) => p.id)).toEqual(["a", "c", "b"]);
    for (let i = 1; i < plan.length; i++) expect(plan[i]!.start >= plan[i - 1]!.end).toBe(true);
  });
});

describe("sun path", () => {
  const maxAltitude = (day: string, at: [number, number]) => {
    let best = -90;
    for (let h = 10; h <= 15; h += 0.05) best = Math.max(best, sunPosition(istDate(day, h), at).altitude);
    return best;
  };
  it("matches the noon sun at the solstices", () => {
    // Mumbai at the June solstice: 90° − (23.44° − 19.08°) ≈ 85.6°
    expect(maxAltitude("2026-06-21", [72.8777, 19.076])).toBeCloseTo(85.6, 0);
    // Delhi at the December solstice: 90° − 28.61° − 23.44° ≈ 38°
    expect(maxAltitude("2026-12-21", [77.209, 28.6139])).toBeCloseTo(38, 0);
  });
  it("rises in the east and sets in the west", () => {
    const pune: [number, number] = [73.8567, 18.5204];
    const morning = sunPosition(istDate("2026-03-20", 8), pune);
    const evening = sunPosition(istDate("2026-03-20", 17.5), pune);
    expect(morning.bearing).toBeGreaterThan(80);
    expect(morning.bearing).toBeLessThan(110);
    expect(evening.bearing).toBeGreaterThan(250);
    expect(evening.bearing).toBeLessThan(280);
    expect(compassPoint(morning.bearing)).toBe("E");
  });
  it("lights only the walls that face the sun", () => {
    const lit = (b: number, alt: number) => sunlitSides("N", { bearing: b, altitude: alt }).filter((s) => s.lit).map((s) => s.faces);
    expect(lit(225, 30)).toEqual(["S", "W"]);
    expect(lit(90, 30)).toEqual(["E"]);
    expect(lit(225, 2)).toEqual([]);
    expect(sunlitSides("E", { bearing: 0, altitude: 40 }).map((s) => s.faces)).toEqual(["E", "S", "W", "N"]);
  });
});

describe("loans and furniture", () => {
  it("pays the loan off exactly and inverts the EMI", () => {
    const rows = amortizationByYear(50_00_000_00, 8.5, 20);
    expect(rows).toHaveLength(20);
    expect(rows.at(-1)!.balance).toBeLessThan(100_00);
    expect(Math.abs(rows.reduce((s, r) => s + r.principal, 0) - 50_00_000_00)).toBeLessThan(100_00);
    const emi = monthlyEmi(50_00_000_00, 8.5, 20);
    expect(Math.abs(loanForEmi(emi, 8.5, 20) - 50_00_000_00)).toBeLessThan(1_000_00);
  });
  it("checks furniture both ways round, keeping a walkway", () => {
    const room = { name: "Bedroom", widthFt: 11, lengthFt: 13 };
    expect(furnitureFit(room, 6.5, 6).fits).toBe(true);
    expect(furnitureFit(room, 14, 3).fits).toBe(false);
    expect(furnitureFit(room, 3, 12).rotated).toBe(true);
  });
});

describe("partners and compare", () => {
  it("gives each developer and broker one profile", () => {
    const names = listPartners().filter((p) => p.type !== "owner").map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });
  it("resolves every kind of shortlist key", () => {
    const p = listProjects("pune")[0]!;
    const unit = p.towers[0]!.units[0]!;
    const l = listListings("pune")[0]!;
    expect(compareRow(`unit:${p.slug}:${unit.number}`)?.pricePaise).toBe(unit.pricePaise);
    expect(compareRow(`project:${p.slug}`)?.title).toBe(p.name);
    expect(compareRow(`listing:${l.slug}`)?.carpetSqft).toBe(l.carpetSqft);
    expect(compareRow("unit:nope:A-101")).toBeNull();
  });
  it("suggests similar homes from the same city", () => {
    const p = listProjects("mumbai")[0]!;
    const similar = similarProjects(p);
    expect(similar.length).toBeGreaterThan(0);
    expect(similar.every((c) => c.cityId === "mumbai" && c.id !== p.slug)).toBe(true);
  });
});

describe("catalogue names", () => {
  it("never reuses a project name across cities", () => {
    const names = listProjects().map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
