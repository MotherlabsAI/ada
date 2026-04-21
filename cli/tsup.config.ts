import { defineConfig } from "tsup";
import { resolve } from "path";

// Resolve @ada/* packages from TypeScript source so esbuild compiles
// everything as native ESM — no CJS/require() shim issues.
const root = resolve(__dirname, "..");

export default defineConfig({
  entry: ["src/index.ts", "src/bin/ada-gate-hook.ts"],
  format: ["esm"],
  outDir: "dist",
  bundle: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  dts: false,
  external: ["ink", "react", "better-sqlite3", "fsevents"],
  esbuildOptions(options) {
    options.conditions = ["import", "default"];
    // Resolve workspace packages from TypeScript source so there are no
    // pre-compiled CJS require() calls in the output bundle.
    options.alias = {
      "@ada/compiler": `${root}/packages/compiler/src/index.ts`,
      "@ada/config-writer": `${root}/packages/config-writer/src/index.ts`,
      "@ada/elicitation": `${root}/packages/elicitation/src/index.ts`,
      "@ada/governor": `${root}/packages/governor/src/index.ts`,
      "@ada/mcp-server": `${root}/packages/mcp-server/src/server.ts`,
      "@ada/orchestrator": `${root}/packages/orchestrator/src/index.ts`,
      "@ada/provenance": `${root}/packages/provenance/src/index.ts`,
      "@ada/storage": `${root}/packages/storage/src/index.ts`,
    };
  },
});
