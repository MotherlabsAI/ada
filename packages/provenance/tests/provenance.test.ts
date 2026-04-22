import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  generatePostcode,
  parsePostcode,
  isValidPostcode,
  ProvenanceStore,
  type PostcodeAddress,
  type ProvenanceRecord,
} from "../src/index.js";

describe("@ada/provenance — postcode", () => {
  it("generatePostcode produces a PostcodeAddress with ML prefix, non-empty hash, and version >= 1", () => {
    const address: PostcodeAddress = generatePostcode("INT", "hello world");
    expect(address.prefix).toBe("ML");
    expect(address.stage).toBe("INT");
    expect(address.hash).not.toBe("");
    expect(address.hash.length).toBeGreaterThan(0);
    expect(address.version).toBeGreaterThanOrEqual(1);
  });

  it("raw postcode string starts with 'ML' and encodes stage + version", () => {
    const address = generatePostcode("SYN", "some blueprint content", 3);
    expect(address.raw.startsWith("ML")).toBe(true);
    expect(address.raw).toMatch(/^ML\.SYN\.[a-f0-9]{8}\/v3$/);
    expect(address.version).toBe(3);
  });

  it("different content yields different postcodes (content-addressed)", () => {
    const a = generatePostcode("ENT", "entity map A");
    const b = generatePostcode("ENT", "entity map B");
    expect(a.hash).not.toBe(b.hash);
    expect(a.raw).not.toBe(b.raw);
  });

  it("identical content at the same stage/version yields identical postcodes (deterministic)", () => {
    const a = generatePostcode("PRO", "process flow", 2);
    const b = generatePostcode("PRO", "process flow", 2);
    expect(a.raw).toBe(b.raw);
    expect(a.hash).toBe(b.hash);
  });

  it("parsePostcode round-trips a generated postcode and isValidPostcode agrees", () => {
    const generated = generatePostcode("GOV", "governor decision");
    const parsed = parsePostcode(generated.raw);
    expect(parsed).not.toBeNull();
    expect(parsed!.prefix).toBe("ML");
    expect(parsed!.stage).toBe("GOV");
    expect(parsed!.hash).toBe(generated.hash);
    expect(parsed!.version).toBe(generated.version);
    expect(isValidPostcode(generated.raw)).toBe(true);
  });

  it("isValidPostcode rejects malformed strings and parsePostcode returns null", () => {
    expect(isValidPostcode("not-a-postcode")).toBe(false);
    expect(isValidPostcode("XX.INT.deadbeef/v1")).toBe(false);
    expect(isValidPostcode("ML.INT.deadbeef")).toBe(false);
    expect(parsePostcode("garbage")).toBeNull();
  });
});

describe("@ada/provenance — ProvenanceStore", () => {
  let dir: string;
  let store: ProvenanceStore;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ada-provenance-"));
    store = new ProvenanceStore(join(dir, "provenance.db"));
  });

  afterEach(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("records a ProvenanceRecord and retrieves it by postcode", () => {
    const address = generatePostcode("INT", "raw intent string");
    store.record(address, [], "raw intent string");
    const got: ProvenanceRecord | undefined = store.get(address.raw);
    expect(got).toBeDefined();
    expect(got!.postcode).toBe(address.raw);
    expect(got!.stage).toBe("INT");
    expect(got!.content).toBe("raw intent string");
    expect(got!.upstreamPostcodes).toEqual([]);
    expect(got!.timestamp).toBeGreaterThan(0);
  });

  it("builds a provenance chain across multiple stages via upstream postcodes", () => {
    const intent = generatePostcode("INT", "intent");
    const domain = generatePostcode("PER", "domain");
    const entities = generatePostcode("ENT", "entities");
    store.record(intent, [], "intent");
    store.record(domain, [intent.raw], "domain");
    store.record(entities, [domain.raw], "entities");

    const chain = store.getChain(entities.raw);
    const postcodes = chain.map((r) => r.postcode);
    expect(postcodes).toContain(entities.raw);
    expect(postcodes).toContain(domain.raw);
    expect(postcodes).toContain(intent.raw);
    expect(store.isChainIntact(entities.raw)).toBe(true);
  });

  it("isChainIntact returns false when an upstream postcode is missing", () => {
    const intent = generatePostcode("INT", "intent-x");
    const domain = generatePostcode("PER", "domain-x");
    // Only record the downstream — upstream is dangling
    store.record(domain, [intent.raw], "domain-x");
    expect(store.isChainIntact(domain.raw)).toBe(false);
    expect(store.isChainIntact("ML.INT.00000000/v1")).toBe(false);
  });
});
