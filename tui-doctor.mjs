// Diagnostic for `ada tui` immediate-exit. Auto-unmounts each trial; safe to run.
// Run in your terminal:  node tui-doctor.mjs
// Compares a minimal Ink render vs the full App to isolate ink-general vs App-specific.
import { writeFileSync, appendFileSync } from "node:fs";
const LOG = "/tmp/ada-tui-doctor.log";
writeFileSync(LOG, "");
const log = (m) => {
  console.log(m);
  try { appendFileSync(LOG, m + "\n"); } catch {}
};

process.on("uncaughtException", (e) => log("UNCAUGHT: " + (e?.stack || e)));
process.on("unhandledRejection", (e) => log("UNHANDLED_REJECTION: " + (e?.stack || e)));

log("=== env ===");
log("node " + process.version);
log("stdin.isTTY=" + process.stdin.isTTY + "  stdout.isTTY=" + process.stdout.isTTY);
log("TERM=" + process.env.TERM + "  cols=" + process.stdout.columns + "  rows=" + process.stdout.rows);
try {
  const inkPkg = (await import("./node_modules/ink/package.json", { with: { type: "json" } })).default;
  const reactPkg = (await import("./node_modules/react/package.json", { with: { type: "json" } })).default;
  log("ink=" + inkPkg.version + "  react=" + reactPkg.version);
} catch (e) { log("version import error: " + e); }

const { render, Text } = await import("ink");
const { createElement: h } = await import("react");

async function trial(name, el, ms) {
  log("--- trial: " + name + " ---");
  const t0 = Date.now();
  try {
    const { waitUntilExit, unmount } = render(el);
    const timer = setTimeout(() => {
      log(name + ": STILL ALIVE at " + ms + "ms (this is the GOOD outcome) — unmounting");
      unmount();
    }, ms);
    await waitUntilExit();
    clearTimeout(timer);
    const dt = Date.now() - t0;
    log(name + ": waitUntilExit RESOLVED after " + dt + "ms" + (dt < ms - 100 ? "  <-- EXITED EARLY (this is the bug)" : ""));
  } catch (e) {
    log(name + ": THREW after " + (Date.now() - t0) + "ms:\n" + (e?.stack || e));
  }
}

await trial("minimal-text", h(Text, null, "hello-ada-doctor"), 1200);

try {
  const { App } = await import("./dist/tui/ink/App.js");
  const { loadPackData, readPackState } = await import("./dist/tui/ink/usePack.js");
  const { graph, manifest, stateFile } = loadPackData(process.cwd(), "service-business-recognition");
  const initialState = readPackState(stateFile);
  await trial(
    "full-App",
    h(App, { slug: "service-business-recognition", graph, manifest, initialState, onPersist: () => {}, onExport: () => {} }),
    1200,
  );
} catch (e) { log("App import/load error:\n" + (e?.stack || e)); }

log("=== done (log saved to " + LOG + ") ===");
process.exit(0);
