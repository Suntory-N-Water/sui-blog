import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2, sandbox } from "@emdash-cms/cloudflare";
import { formsPlugin } from "@emdash-cms/plugin-forms";
import webhookNotifier from "@emdash-cms/plugin-webhook-notifier";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";

export default defineConfig({
	output: "server",
	site: "https://suntory-n-water.com",
	adapter: cloudflare(),
	redirects: {
		"/sitemap-index.xml": { status: 301, destination: "/sitemap.xml" },
	},
 i18n: {
    defaultLocale: "ja",
    locales: ["ja"],
  },
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			mcp: true,
			database: d1({ binding: "DB", session: "auto" }),
			storage: r2({ binding: "MEDIA" }),
			middleware: { outer: "./src/middleware/outer.ts" },
			plugins: [formsPlugin()],
			sandboxed: [webhookNotifier],
			sandboxRunner: sandbox(),
			marketplace: "https://marketplace.emdashcms.com",
		}),
	],
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Inter",
			cssVariable: "--font-latin",
			weights: [400, 500, 600, 700],
			subsets: ["latin", "latin-ext"],
			fallbacks: [],
		},
		{
			provider: fontProviders.google(),
			name: "Noto Sans JP",
			cssVariable: "--font-jp",
			weights: [400, 500, 600],
			subsets: ["japanese", "latin"],
			fallbacks: ["sans-serif"],
		},
		{
			provider: fontProviders.google(),
			name: "JetBrains Mono",
			cssVariable: "--font-mono-latin",
			weights: [400, 500],
			subsets: ["latin", "latin-ext"],
			fallbacks: [],
		},
	],
	devToolbar: { enabled: false },
	vite: {
		build: { cssTarget: ["chrome123", "edge123", "firefox120", "safari17.5"] },
	},
});
