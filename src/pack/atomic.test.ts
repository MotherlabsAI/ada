import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { atomicReplace } from "./writer.js";

const tmp = () => mkdtemp(join(tmpdir(), "ada-atomic-"));

test("atomicReplace: a thrown error mid-write restores the previous pack intact (INVARIANT.002)", async () => {
  const base = await tmp();
  const root = join(base, "pack");
  await mkdir(root, { recursive: true });
  await writeFile(join(root, "graph.json"), "OLD", "utf8");

  await assert.rejects(
    atomicReplace(root, async () => {
      await mkdir(root, { recursive: true });
      await writeFile(join(root, "graph.json"), "PARTIAL-NEW", "utf8");
      throw new Error("boom mid-write");
    }),
    /boom mid-write/,
    "the write error propagates",
  );
  assert.equal(
    readFileSync(join(root, "graph.json"), "utf8"),
    "OLD",
    "the previous pack is restored — never the half-written one",
  );
  assert.ok(!existsSync(`${root}.bak`), "no backup left behind");
  await rm(base, { recursive: true, force: true });
});

test("atomicReplace: a successful write replaces the pack and leaves no backup", async () => {
  const base = await tmp();
  const root = join(base, "pack");
  await mkdir(root, { recursive: true });
  await writeFile(join(root, "graph.json"), "OLD", "utf8");

  await atomicReplace(root, async () => {
    await mkdir(root, { recursive: true });
    await writeFile(join(root, "graph.json"), "NEW", "utf8");
    await writeFile(join(root, "manifest.json"), "{}", "utf8");
  });
  assert.equal(readFileSync(join(root, "graph.json"), "utf8"), "NEW");
  assert.ok(
    existsSync(join(root, "manifest.json")),
    "the new files are present",
  );
  assert.ok(!existsSync(`${root}.bak`), "backup dropped on success");
  await rm(base, { recursive: true, force: true });
});

test("atomicReplace: first write (no previous pack) — failure leaves nothing, then success creates it", async () => {
  const base = await tmp();
  const root = join(base, "pack");
  await assert.rejects(
    atomicReplace(root, async () => {
      await mkdir(root, { recursive: true });
      await writeFile(join(root, "x"), "partial", "utf8");
      throw new Error("fail");
    }),
    /fail/,
  );
  assert.ok(
    !existsSync(root),
    "no partial pack when there was no previous to fall back to",
  );
  assert.ok(!existsSync(`${root}.bak`));

  await atomicReplace(root, async () => {
    await mkdir(root, { recursive: true });
    await writeFile(join(root, "x"), "ok", "utf8");
  });
  assert.equal(readFileSync(join(root, "x"), "utf8"), "ok");
  await rm(base, { recursive: true, force: true });
});
