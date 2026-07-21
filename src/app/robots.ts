import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/room/", "/api/"],
      },
    ],
    sitemap: "https://ruang-kelas-beige.vercel.app/sitemap.xml",
  };
}
