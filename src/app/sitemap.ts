import type { MetadataRoute } from "next";
import { getAllCPTCodes } from "@/lib/cpt";
import { authors } from "@/lib/cpt/authors";
import { SITE_URL } from "@/lib/site-url";

const BASE_URL = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/codes`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  const codeRoutes: MetadataRoute.Sitemap = getAllCPTCodes().map((c) => ({
    url: `${BASE_URL}/codes/${c.code}`,
    lastModified: new Date(c.updatedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const authorRoutes: MetadataRoute.Sitemap = Object.values(authors)
    .filter((a) => !a.credentials.includes("REPLACE"))
    .map((a) => ({
      url: `${BASE_URL}/authors/${a.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    }));

  return [...staticRoutes, ...codeRoutes, ...authorRoutes];
}
