import { listCities, listListings, listLocalities, listPartners, listProjects } from "@vybe/core/catalog";
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => `${SITE_URL}${path}`;
  const page = (path: string, changeFrequency: "hourly" | "daily" | "monthly", priority: number) => ({ url: url(path), changeFrequency, priority });
  return [
    page("/", "daily", 1),
    ...["/home-loan-emi-calculator", "/about", "/how-we-verify", "/help", "/privacy", "/terms"].map((p) => page(p, "monthly", 0.4)),
    ...listCities().flatMap((c) => [
      page(`/${c.id}`, "hourly", 0.9),
      page(`/${c.id}/vibe-check`, "monthly", 0.5),
      ...listLocalities(c.id).map((l) => page(`/${c.id}/${l.slug}`, "daily", 0.7)),
    ]),
    ...listProjects().flatMap((p) => [page(`/projects/${p.slug}`, "hourly", 0.8), ...p.unitTypes.map((_, i) => page(`/projects/${p.slug}/walk/${i}`, "monthly", 0.4))]),
    ...listListings().flatMap((l) => [{ ...page(`/homes/${l.slug}`, "daily", 0.6), lastModified: l.postedOn }, page(`/homes/${l.slug}/walk`, "monthly", 0.3)]),
    ...listPartners()
      .filter((p) => p.type !== "owner")
      .map((p) => page(`/partners/${p.id}`, "daily", 0.5)),
  ];
}
