import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildShowcasePack } from "../../compile/showcase.js";
import { writePack } from "../../pack/writer.js";
import { loadPackData, listPacks } from "./usePack.js";

test("loadPackData returns graph nodes and manifest clusters", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "ada-tui-"));
  const slug = "showcase";
  await writePack(cwd, buildShowcasePack(slug, "test intent"));

  const data = loadPackData(cwd, slug);
  assert.ok(data.graph.nodes.length > 0, "expected graph nodes");
  assert.ok(data.manifest.clusters.length > 0, "expected manifest clusters");
  assert.equal(data.manifest.slug, slug);
  assert.ok(typeof data.stateFile === "string" && data.stateFile.length > 0);
});

test("listPacks returns a summary per pack on disk", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "ada-tui-"));
  await writePack(cwd, buildShowcasePack("alpha", "first intent"));
  await writePack(cwd, buildShowcasePack("beta", "second intent"));

  const packs = listPacks(cwd);
  const slugs = packs.map((p) => p.slug).sort();
  assert.deepEqual(slugs, ["alpha", "beta"]);
  const alpha = packs.find((p) => p.slug === "alpha")!;
  assert.ok(alpha.nodes > 0, "node count surfaced");
  assert.ok(alpha.clusters > 0, "cluster count surfaced");
  assert.equal(typeof alpha.checks, "number");
  assert.equal(typeof alpha.residue, "number");
});

test("listPacks is empty (no throw) when there is no packs root", () => {
  const cwd = mkdtempSync(join(tmpdir(), "ada-tui-empty-"));
  assert.deepEqual(listPacks(cwd), []);
});
