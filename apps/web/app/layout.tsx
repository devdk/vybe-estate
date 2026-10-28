import { listCities } from "@vybe/core/catalog";
import type { Metadata, Viewport } from "next";
import { Figtree, JetBrains_Mono, Unbounded } from "next/font/google";
import Link from "next/link";
import { LiteToggle, ShortlistLink, StoreHydrator } from "@/components/HeaderControls";
import "./globals.css";

const display = Unbounded({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-unbounded", display: "swap" });
const body = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100"),
  title: { default: "Vybe Estate · Homes in India's top housing markets, in 3D", template: "%s · Vybe Estate" },
  description: "New launches, resale and rentals in Mumbai, Bengaluru, Pune, Delhi-NCR and Hyderabad. Explore each city in 3D, pick the exact flat, and book site visits in one go.",
};

const FOOTER = (cities: { id: string; name: string }[]) => [
  { title: "Cities", links: cities.map((c) => ({ label: c.name, href: `/${c.id}` })) },
  {
    title: "Tools",
    links: [
      { label: "Compare homes", href: "/compare" },
      { label: "Your shortlist", href: "/shortlist" },
      { label: "Home loan EMI calculator", href: "/home-loan-emi-calculator" },
      ...cities.slice(0, 2).map((c) => ({ label: `Vibe check: ${c.name}`, href: `/${c.id}/vibe-check` })),
    ],
  },
  {
    title: "Vybe",
    links: [
      { label: "About", href: "/about" },
      { label: "How we verify", href: "/how-we-verify" },
      { label: "Help", href: "/help" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy notice", href: "/privacy" },
      { label: "Terms of use", href: "/terms" },
    ],
  },
];

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "white", colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cities = listCities();
  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-dvh text-[15px] leading-normal">
        <a href="#main" className="sr-only z-50 rounded-lg bg-ink px-3 py-2 text-bg focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <p className="border-b border-line bg-surface px-4 py-1.5 text-center text-[12px] text-muted">
          Demo build: projects, partners, prices, unit status and RERA numbers are invented. City sales figures are Anarock, Q3 2026.
        </p>
        <header className="sticky top-0 z-40 border-b border-line bg-surface">
          <div className="mx-auto flex max-w-[1260px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
            <Link href="/" className="flex items-baseline font-display text-xl font-bold tracking-tight" aria-label="Vybe Estate home">
              vybe<b className="text-accent">.</b>
              <span className="ml-0.5 font-mono text-xs font-medium text-muted">estate</span>
            </Link>
            <nav aria-label="Cities" className="order-3 -mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto px-4 sm:order-none sm:mx-0 sm:w-auto sm:px-0">
              {cities.map((c) => (
                <Link key={c.id} href={`/${c.id}`} className="whitespace-nowrap rounded-full px-3 py-1.5 text-[13.5px] font-semibold text-muted hover:bg-raised hover:text-ink">
                  {c.name}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <Link href="/compare" className="hidden rounded-full px-3 py-1.5 text-[13.5px] font-semibold text-muted hover:bg-raised hover:text-ink md:block">
                Compare
              </Link>
              <LiteToggle />
              <ShortlistLink />
            </div>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="mt-20 border-t border-line bg-surface">
          <div className="mx-auto grid max-w-[1260px] gap-8 px-4 py-10 text-[13.5px] sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
            <div>
              <Link href="/" className="flex items-baseline font-display text-lg font-bold tracking-tight">
                vybe<b className="text-accent">.</b>
                <span className="ml-0.5 font-mono text-xs font-medium text-muted">estate</span>
              </Link>
              <p className="mt-2 max-w-[34ch] text-muted">New launches, resale and rentals in five cities. Price, floor plan and RERA details on every listing, without signing in.</p>
            </div>
            {FOOTER(cities).map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h2 className="font-mono text-[11px] uppercase tracking-[.12em] text-muted">{col.title}</h2>
                <ul className="mt-3 grid gap-2">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="hover:text-accent-strong">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
          <div className="mx-auto max-w-[1260px] border-t border-line px-4 py-5 text-[12px] text-muted">
            City sales figures: Anarock, Q3 2026. Projects, partners, prices, flat availability and RERA numbers in this build are invented for demonstration.
          </div>
        </footer>
        <StoreHydrator />
      </body>
    </html>
  );
}
