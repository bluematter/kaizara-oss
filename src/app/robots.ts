import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep authenticated areas out of the index.
        disallow: ["/dashboard", "/patients", "/encounters", "/inventory", "/labs", "/shipping", "/tasks", "/messages", "/settings", "/consult", "/p/", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: `${SITE_URL}`,
  };
}
