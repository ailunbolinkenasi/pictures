import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import sharp from "sharp";

export default defineConfig({
  site: "https://mysite.com",
  devToolbar: {
    enabled: false,
  },
  integrations: [sitemap()],
  prefetch: true,
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        // 保留 EXIF 元数据
        withMetadata: true,
      },
    },
  },
  vite: {
    ssr: {
      noExternal: ["smartypants"],
    },
  },
});
