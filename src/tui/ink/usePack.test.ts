import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildShowcasePack } from "../../compile/showcase.js";
import { writePack } from "../../pack/writer.js";
import { loadPackData } from "./usePack.js";

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
