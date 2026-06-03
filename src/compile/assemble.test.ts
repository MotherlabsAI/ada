import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assemblePackGated } from "./assemble.js";
import { GENERIC_EXEMPLARS, IMPRESSIVE_EXEMPLARS } from "./calibration.js";
import { writePack } from "../pack/writer.js";
import { paths } from "../pack/layout.js";
import { clusterLabel } from "../tui/ink/lines.js";
import type { PackManifest } from "../core/types.js";

test("rejected nodes are dropped from the pack and counted", () => {
  const specs = [...IMPRESSIVE_EXEMPLARS, ...GENERIC_EXEMPLARS];
  const { model, rejected } = assemblePackGated("t", "intent", specs);
  assert.equal(rejected.length, GENERIC_EXEMPLARS.length);
  // ROOT.000 + kept specs
  assert.equal(model.graph.nodes.length, IMPRESSIVE_EXEMPLARS.length + 1);
});

test("a proposed cluster registry round-trips through assemble → writePack → manifest.json (P7)", async () => {
  // A registry that names a DYNAMIC label not in the hardcoded TUI map (COPY→bespoke), plus
  // areas present and absent in the pack. assemblePackGated carries it onto the model; the
  // writer stores it in the manifest, restricted to clusters actually present.
  const registry = {
    ROOT: "Context root",
    ATT: "Salience",
    COPY: "Bespoke Copy Area", // overrides the hardcoded "Copy & language"
    SEO: "Findability",
    UNK: "Unknown-unknowns",
    GHOST: "Not in this pack", // absent cluster → must be filtered out
  };
  const { model } = assemblePackGated(
    "reg",
    "intent",
    IMPRESSIVE_EXEMPLARS,
    undefined,
    registry,
  );
  assert.deepEqual(
    model.clusterLabels,
    registry,
    "model carries the full registry",
  );

  const cwd = mkdtempSync(join(tmpdir(), "ada-reg-"));
  const manifest = await writePack(cwd, model);
  // The manifest only retains labels for clusters that exist in the pack.
  assert.ok(manifest.clusterLabels, "manifest carries the registry");
  assert.equal(manifest.clusterLabels!["COPY"], "Bespoke Copy Area");
  assert.equal(
    manifest.clusterLabels!["GHOST"],
    undefined,
    "absent cluster filtered from the manifest",
  );

  // It survives serialization to disk identically.
  const onDisk = JSON.parse(
    readFileSync(paths(cwd, "reg").manifest, "utf8"),
  ) as PackManifest;
  assert.deepEqual(onDisk.clusterLabels, manifest.clusterLabels);

  // clusterLabel resolves the dynamic, non-hardcoded label from the round-tripped registry,
  // while a known code still resolves and the registry override wins over the built-in map.
  assert.equal(clusterLabel("COPY", onDisk.clusterLabels), "Bespoke Copy Area");
  assert.equal(clusterLabel("ATT", onDisk.clusterLabels), "Salience");
  assert.equal(clusterLabel("ROOT", onDisk.clusterLabels), "Context root");
});

test("omitting the registry leaves the manifest without clusterLabels (back-compat / showcase)", async () => {
  const { model } = assemblePackGated("noreg", "intent", IMPRESSIVE_EXEMPLARS);
  assert.equal(model.clusterLabels, undefined);
  const cwd = mkdtempSync(join(tmpdir(), "ada-noreg-"));
  const manifest = await writePack(cwd, model);
  assert.equal(manifest.clusterLabels, undefined);
  // clusterLabel then falls back to the built-in map for known codes, raw code otherwise.
  assert.equal(clusterLabel("ATT"), "Attention");
  assert.equal(clusterLabel("ZZZ"), "ZZZ");
});
