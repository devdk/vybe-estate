"use client";

import { CITY_SPEED_KMH, formatINR, planVisitDay, type CityId, type VisitStop } from "@vybe/core";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useShortlist, type ShortlistItem } from "@/lib/store";
import { INDIAN_MOBILE } from "@/lib/visit-request";
import { CloseIcon, btn, chip } from "./ui";

const CITY_NAMES: Record<CityId, string> = { mumbai: "Mumbai", bengaluru: "Bengaluru", pune: "Pune", "delhi-ncr": "Delhi-NCR", hyderabad: "Hyderabad" };
const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const price = (i: ShortlistItem) => (i.isRent ? `${formatINR(i.pricePaise, { compact: false })}/month` : formatINR(i.pricePaise));

/** Flats in the same project with the same seller are one stop. */
function toStops(items: ShortlistItem[]): VisitStop[] {
  const byPlace = new Map<string, ShortlistItem[]>();
  for (const i of items) {
    const k = `${i.partnerName}|${i.location[0].toFixed(4)}|${i.location[1].toFixed(4)}`;
    byPlace.set(k, [...(byPlace.get(k) ?? []), i]);
  }
  return [...byPlace.values()].map((group) => ({
    id: group.map((g) => g.key).join("+"),
    label: group.map((g) => g.title).join(", "),
    partnerName: group[0]!.partnerName,
    location: group[0]!.location,
  }));
}

type Booking = { reference: string; date: string; stops: { label: string; partnerName: string; start: string; end: string }[] };

export function ShortlistView() {
  const items = useShortlist((s) => s.items);
  const remove = useShortlist((s) => s.remove);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const done = () => setHydrated(true);
    if (useShortlist.persist.hasHydrated()) done();
    return useShortlist.persist.onFinishHydration(done);
  }, []);

  const cities = [...new Set(items.map((i) => i.cityId))];
  const [cityPick, setCityPick] = useState<CityId | null>(null);
  const city = cityPick && cities.includes(cityPick) ? cityPick : cities[0];
  const cityItems = items.filter((i) => i.cityId === city);

  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return isoDate(d);
  }, []);
  const [date, setDate] = useState("");
  const [startHour, setStartHour] = useState(10);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);

  const plan = useMemo(() => planVisitDay(toStops(cityItems), startHour), [cityItems, startHour]);

  if (!hydrated) return <p className="mt-8 text-muted">Loading your shortlist…</p>;

  if (items.length === 0)
    return (
      <div className="mt-8 rounded-[20px] border border-dashed border-line px-6 py-10 text-center">
        <p className="text-lg font-bold">Nothing saved yet.</p>
        <p className="mt-1 text-muted">Open a project&apos;s tower explorer and add a flat, or save a resale or rental listing.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {Object.entries(CITY_NAMES).map(([id, n]) => (
            <Link key={id} href={`/${id}`} className={`${btn.ghost} ${btn.small}`}>
              {n}
            </Link>
          ))}
        </div>
      </div>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!date) return setError("Pick a date for the visits.");
    if (!INDIAN_MOBILE.test(phone.trim())) return setError("Enter a 10-digit Indian mobile number.");
    setSending(true);
    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date, startHour, name, phone, consent, stops: plan.map((p) => ({ key: p.id, label: p.label, partnerName: p.partnerName, start: p.start, end: p.end })) }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Something went wrong. Try again.");
      else setBooking(data);
    } catch {
      setError("You seem to be offline. Your shortlist is saved; try again when you're connected.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section aria-labelledby="saved-h">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="saved-h" className="text-base font-bold">
            {items.length} saved
          </h2>
          {items.length >= 2 && (
            <Link href="/compare" className={`${btn.ghost} ${btn.small}`}>
              Compare side by side
            </Link>
          )}
        </div>
        <ul className="grid gap-2.5">
          {items.map((i) => (
            <li key={i.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-line bg-raised p-3.5">
              <div className="min-w-0">
                <Link href={i.href} className="font-bold hover:text-accent-strong">
                  {i.title}
                </Link>
                <p className="truncate text-[13px] text-muted">{i.subtitle}</p>
                <p className="text-[12.5px] text-muted">
                  <span className="font-mono text-ink">{price(i)}</span> · {i.partnerName} · {CITY_NAMES[i.cityId]}
                </p>
              </div>
              <button type="button" onClick={() => remove(i.key)} className="grid size-9 place-items-center rounded-full border border-line" aria-label={`Remove ${i.title}`}>
                <CloseIcon />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section id="plan" className="scroll-mt-20 rounded-[22px] border border-line bg-raised p-5" aria-labelledby="plan-h">
        {booking ? (
          <div aria-live="polite">
            <h2 id="plan-h" className="font-display text-xl">
              Visit request sent
            </h2>
            <p className="mt-1 text-muted">
              Reference <b className="font-mono text-ink">{booking.reference}</b>. Each seller confirms their slot for{" "}
              {new Date(`${booking.date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}.
            </p>
            <ol className="mt-4 grid gap-2">
              {booking.stops.map((s) => (
                <li key={s.label} className="rounded-xl bg-bg p-3 text-[13.5px]">
                  <span className="font-mono">
                    {s.start}–{s.end}
                  </span>{" "}
                  · {s.label} <span className="text-muted">with {s.partnerName}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[12px] text-muted">Demo build: requests are kept in memory and no seller is contacted.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4" noValidate>
            <h2 id="plan-h" className="font-display text-xl">
              Plan a day of visits
            </h2>
            {cities.length > 1 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="City to visit">
                {cities.map((c) => (
                  <button key={c} type="button" aria-pressed={c === city} onClick={() => setCityPick(c)} className={chip(c === city)}>
                    {CITY_NAMES[c]}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-[13px] text-muted">
                Date
                <input type="date" required min={tomorrow} value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-line bg-bg px-2.5 py-1.5 text-[14px] text-ink" />
              </label>
              <label className="grid gap-1 text-[13px] text-muted">
                Start at
                <select value={startHour} onChange={(e) => setStartHour(Number(e.target.value))} className="rounded-lg border border-line bg-bg px-2.5 py-1.5 text-[14px] text-ink">
                  {[9, 10, 11, 12, 13, 14, 15, 16].map((h) => (
                    <option key={h} value={h}>
                      {h <= 12 ? `${h}${h === 12 ? " pm" : " am"}` : `${h - 12} pm`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <ol className="grid gap-2" aria-label="Suggested route">
              {plan.map((p) => (
                <li key={p.id} className="rounded-xl bg-bg p-3 text-[13.5px]">
                  {p.travelMinutes > 0 && <p className="mb-1 text-[12px] text-muted">About {p.travelMinutes} min drive</p>}
                  <span className="font-mono">
                    {p.start}–{p.end}
                  </span>{" "}
                  · {p.label} <span className="text-muted">with {p.partnerName}</span>
                </li>
              ))}
            </ol>
            <p className="text-[12px] text-muted">Drive times are estimates from distance at about {CITY_SPEED_KMH} km/h; sellers can move a slot when they confirm.</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-[13px] text-muted">
                Your name
                <input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-line bg-bg px-2.5 py-1.5 text-[14px] text-ink" />
              </label>
              <label className="grid gap-1 text-[13px] text-muted">
                Mobile number
                <input required type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg border border-line bg-bg px-2.5 py-1.5 font-mono text-[14px] text-ink" />
              </label>
            </div>
            <label className="flex items-start gap-2 text-[13px]">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[var(--accent)]" />
              <span>
                Share my name and number with {[...new Set(plan.map((p) => p.partnerName))].join(", ")} for these visits only. You can withdraw consent at any time.
              </span>
            </label>
            {error && (
              <p role="alert" className="rounded-lg bg-accent-soft px-3 py-2 text-[13.5px] text-accent-strong">
                {error}
              </p>
            )}
            <button type="submit" disabled={!consent || sending} className={btn.primary}>
              {sending ? "Sending…" : `Request ${plan.length} ${plan.length === 1 ? "visit" : "visits"}`}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
