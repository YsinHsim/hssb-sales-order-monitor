import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },

  css: ["~/assets/css/main.css"],

  // Server-only config. The API key is never exposed to the browser:
  // the client talks to our own /api/* routes, which add the key upstream.
  // Override with NUXT_SALES_API_BASE / NUXT_SALES_API_KEY.
  runtimeConfig: {
    salesApiBase: "https://hiring.harrisons.my/api/mock/sales-orders",
    salesApiKey: "",
  },

  app: {
    head: {
      title: "Sales Order Monitoring",
      htmlAttrs: { lang: "en" },
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "Monitor sales orders across branches." },
      ],
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  nitro: {
    preset: "vercel",
  },
});
