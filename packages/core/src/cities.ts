import type { City, Locality } from "./types";

const ANAROCK_Q3_2026 = { source: "Anarock", asOf: "Q3 2026" };

export const CITIES: City[] = [
  { id: "mumbai", name: "Mumbai", region: "Mumbai (MMR)", state: "Maharashtra", center: [72.95, 19.12], sales: { units: 31_750, yoyPct: 5, ...ANAROCK_Q3_2026 } },
  { id: "bengaluru", name: "Bengaluru", region: "Bengaluru", state: "Karnataka", center: [77.68, 12.95], sales: { units: 16_670, yoyPct: 12, ...ANAROCK_Q3_2026 } },
  { id: "pune", name: "Pune", region: "Pune", state: "Maharashtra", center: [73.82, 18.57], sales: { units: 15_690, yoyPct: -6, ...ANAROCK_Q3_2026 } },
  { id: "delhi-ncr", name: "Delhi-NCR", region: "Delhi-NCR", state: "Haryana and Uttar Pradesh", center: [77.15, 28.47], sales: { units: 13_765, yoyPct: -1, ...ANAROCK_Q3_2026 } },
  { id: "hyderabad", name: "Hyderabad", region: "Hyderabad", state: "Telangana", center: [78.35, 17.46], sales: { units: 12_970, yoyPct: 15, ...ANAROCK_Q3_2026 } },
];

const psf = (rupees: number) => rupees * 100;

/**
 * First micro-markets to seed, from the blueprint. Centres are approximate.
 * Vibe inputs and base rates are placeholders until the locality data source
 * (maps API, open data or partner data) is chosen.
 */
export const LOCALITIES: Locality[] = [
  { cityId: "mumbai", slug: "thane", name: "Thane", center: [72.9781, 19.2183], reraAuthority: "MahaRERA", basePsfPaise: psf(16_000), vibe: { commute: 7, schools: 8, greenCover: 7, nightlife: 6, appreciation: 8 } },
  { cityId: "mumbai", slug: "navi-mumbai", name: "Navi Mumbai", center: [73.0297, 19.033], reraAuthority: "MahaRERA", basePsfPaise: psf(13_500), vibe: { commute: 7, schools: 7, greenCover: 8, nightlife: 5, appreciation: 8 } },
  { cityId: "mumbai", slug: "andheri", name: "Andheri", center: [72.8697, 19.1136], reraAuthority: "MahaRERA", basePsfPaise: psf(31_000), vibe: { commute: 9, schools: 8, greenCover: 4, nightlife: 9, appreciation: 6 } },
  { cityId: "mumbai", slug: "powai", name: "Powai", center: [72.9051, 19.1176], reraAuthority: "MahaRERA", basePsfPaise: psf(29_000), vibe: { commute: 7, schools: 9, greenCover: 7, nightlife: 8, appreciation: 7 } },
  { cityId: "mumbai", slug: "chembur", name: "Chembur", center: [72.899, 19.0522], reraAuthority: "MahaRERA", basePsfPaise: psf(26_000), vibe: { commute: 8, schools: 7, greenCover: 5, nightlife: 6, appreciation: 7 } },

  { cityId: "bengaluru", slug: "whitefield", name: "Whitefield", center: [77.75, 12.9698], reraAuthority: "K-RERA", basePsfPaise: psf(11_500), vibe: { commute: 6, schools: 8, greenCover: 6, nightlife: 7, appreciation: 8 } },
  { cityId: "bengaluru", slug: "sarjapur-road", name: "Sarjapur Road", center: [77.688, 12.905], reraAuthority: "K-RERA", basePsfPaise: psf(10_500), vibe: { commute: 5, schools: 8, greenCover: 7, nightlife: 6, appreciation: 9 } },
  { cityId: "bengaluru", slug: "north-bengaluru", name: "North Bengaluru", center: [77.596, 13.1], reraAuthority: "K-RERA", basePsfPaise: psf(9_500), vibe: { commute: 7, schools: 7, greenCover: 8, nightlife: 5, appreciation: 9 } },
  { cityId: "bengaluru", slug: "electronic-city", name: "Electronic City", center: [77.6603, 12.8452], reraAuthority: "K-RERA", basePsfPaise: psf(7_500), vibe: { commute: 6, schools: 6, greenCover: 6, nightlife: 5, appreciation: 7 } },

  { cityId: "pune", slug: "hinjewadi", name: "Hinjewadi", center: [73.738, 18.5912], reraAuthority: "MahaRERA", basePsfPaise: psf(8_800), vibe: { commute: 6, schools: 7, greenCover: 6, nightlife: 5, appreciation: 7 } },
  { cityId: "pune", slug: "wakad", name: "Wakad", center: [73.7629, 18.5986], reraAuthority: "MahaRERA", basePsfPaise: psf(9_800), vibe: { commute: 7, schools: 8, greenCover: 6, nightlife: 6, appreciation: 7 } },
  { cityId: "pune", slug: "kharadi", name: "Kharadi", center: [73.941, 18.5515], reraAuthority: "MahaRERA", basePsfPaise: psf(12_000), vibe: { commute: 7, schools: 8, greenCover: 6, nightlife: 8, appreciation: 8 } },
  { cityId: "pune", slug: "baner", name: "Baner", center: [73.7868, 18.559], reraAuthority: "MahaRERA", basePsfPaise: psf(13_500), vibe: { commute: 7, schools: 8, greenCover: 7, nightlife: 8, appreciation: 7 } },

  { cityId: "delhi-ncr", slug: "dwarka-expressway", name: "Dwarka Expressway", center: [76.985, 28.482], reraAuthority: "HRERA Gurugram", basePsfPaise: psf(15_000), vibe: { commute: 7, schools: 7, greenCover: 6, nightlife: 5, appreciation: 9 } },
  { cityId: "delhi-ncr", slug: "golf-course-extension", name: "Golf Course Ext.", center: [77.1, 28.405], reraAuthority: "HRERA Gurugram", basePsfPaise: psf(19_000), vibe: { commute: 6, schools: 8, greenCover: 7, nightlife: 7, appreciation: 8 } },
  { cityId: "delhi-ncr", slug: "noida-expressway", name: "Noida Expressway", center: [77.39, 28.505], reraAuthority: "UP RERA", basePsfPaise: psf(12_000), vibe: { commute: 8, schools: 8, greenCover: 7, nightlife: 6, appreciation: 8 } },

  { cityId: "hyderabad", slug: "kokapet", name: "Kokapet", center: [78.334, 17.396], reraAuthority: "TG RERA", basePsfPaise: psf(13_500), vibe: { commute: 7, schools: 8, greenCover: 7, nightlife: 7, appreciation: 9 } },
  { cityId: "hyderabad", slug: "gachibowli", name: "Gachibowli", center: [78.3489, 17.4401], reraAuthority: "TG RERA", basePsfPaise: psf(12_000), vibe: { commute: 8, schools: 8, greenCover: 6, nightlife: 8, appreciation: 8 } },
  { cityId: "hyderabad", slug: "tellapur", name: "Tellapur", center: [78.28, 17.457], reraAuthority: "TG RERA", basePsfPaise: psf(9_000), vibe: { commute: 6, schools: 7, greenCover: 8, nightlife: 4, appreciation: 8 } },
  { cityId: "hyderabad", slug: "kompally", name: "Kompally", center: [78.486, 17.536], reraAuthority: "TG RERA", basePsfPaise: psf(7_500), vibe: { commute: 6, schools: 7, greenCover: 7, nightlife: 4, appreciation: 7 } },
];
