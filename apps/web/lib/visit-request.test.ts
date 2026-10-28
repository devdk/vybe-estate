import { describe, expect, it } from "vitest";
import { validateVisitRequest } from "./visit-request";

const today = new Date(2026, 9, 27);
const valid = {
  date: "2026-10-29",
  startHour: 10,
  name: "Test Buyer",
  phone: "+91 90000 00001",
  consent: true,
  stops: [{ key: "a", label: "A-1203 · Skylark Towers", partnerName: "Kestrel Habitats", start: "10:00", end: "10:45" }],
};

describe("validateVisitRequest", () => {
  it("accepts a complete request", () => {
    expect(validateVisitRequest(valid, today)).toMatchObject({ ok: true });
  });
  it("requires explicit consent", () => {
    expect(validateVisitRequest({ ...valid, consent: false }, today)).toMatchObject({ ok: false });
  });
  it("rejects numbers that are not Indian mobiles", () => {
    for (const phone of ["12345", "5000000001", "+44 7700 900123"]) expect(validateVisitRequest({ ...valid, phone }, today).ok).toBe(false);
  });
  it("only books from tomorrow up to 60 days out", () => {
    expect(validateVisitRequest({ ...valid, date: "2026-10-27" }, today).ok).toBe(false);
    expect(validateVisitRequest({ ...valid, date: "2026-10-28" }, today).ok).toBe(true);
    expect(validateVisitRequest({ ...valid, date: "2027-03-01" }, today).ok).toBe(false);
  });
  it("needs at least one stop", () => {
    expect(validateVisitRequest({ ...valid, stops: [] }, today).ok).toBe(false);
  });
});
