"use client";

import { useState } from "react";
import type { District } from "@/lib/showroom-data";
import { CityShowroom } from "./CityShowroom";
import { chip } from "./ui";

export function HomeShowroom({ cities, worlds }: { cities: { id: string; name: string }[]; worlds: Record<string, District[]> }) {
  const [cityId, setCityId] = useState(cities[0]!.id);
  const city = cities.find((c) => c.id === cityId)!;
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="City shown in the showroom">
        {cities.map((c) => (
          <button key={c.id} type="button" aria-pressed={c.id === cityId} onClick={() => setCityId(c.id)} className={chip(c.id === cityId)}>
            {c.name}
          </button>
        ))}
      </div>
      <CityShowroom cityId={city.id} cityName={city.name} districts={worlds[city.id]!} />
    </div>
  );
}
