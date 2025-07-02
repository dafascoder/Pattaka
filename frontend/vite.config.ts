// vite.config.ts

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:8080",
			},
		},
		port: 3000,
	},
	plugins: [tsConfigPaths(), tailwindcss(), tanstackStart()],
});
