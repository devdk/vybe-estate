"use client";

import type { CityId, LngLat } from "@vybe/core";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

/** localStorage can be missing or throw (private mode, blocked storage); the app must still work. */
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  },
};

export interface ShortlistItem {
  key: string;
  kind: "unit" | "project" | "listing";
  title: string;
  subtitle: string;
  href: string;
  pricePaise: number;
  isRent: boolean;
  partnerName: string;
  location: LngLat;
  cityId: CityId;
}

interface ShortlistState {
  items: ShortlistItem[];
  toggle: (item: ShortlistItem) => void;
  add: (item: ShortlistItem) => void;
  remove: (key: string) => void;
  clear: () => void;
}

export const useShortlist = create<ShortlistState>()(
  persist(
    (set) => ({
      items: [],
      toggle: (item) => set((s) => ({ items: s.items.some((i) => i.key === item.key) ? s.items.filter((i) => i.key !== item.key) : [...s.items, item] })),
      add: (item) => set((s) => (s.items.some((i) => i.key === item.key) ? s : { items: [...s.items, item] })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    { name: "vybe-shortlist", storage: createJSONStorage(() => safeStorage), skipHydration: true },
  ),
);

interface PrefsState {
  /** null = decide from the device; true/false = the buyer's own choice. */
  lite: boolean | null;
  setLite: (lite: boolean | null) => void;
}

export const usePrefs = create<PrefsState>()(
  persist((set) => ({ lite: null, setLite: (lite) => set({ lite }) }), {
    name: "vybe-prefs",
    storage: createJSONStorage(() => safeStorage),
    skipHydration: true,
  }),
);
