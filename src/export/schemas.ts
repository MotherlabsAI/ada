/**
 * The SCHEMAS-IR projection ("compile the family" frontier — the §2 envelope, machine-enforceable).
 *
 * The export taxonomy's §06 (schemas/IR): the universal asset envelope, the typed node, and the typed
 * edge as machine JSON Schemas, so the family stops being prose-only and becomes VALIDATABLE — a
 * consumer (or a check) can reject a malformed asset structurally. The node/edge enums are sourced
 * from the real `NODE_TYPES` / `EDGE_TYPES` so the schema cannot drift from types.ts. Deterministic,
 * model-free (A3): static schema shapes (pack-invariant) emitted as byte-stable JSON.
 */
import type { PackModel } from "../core/types.js";
import { NODE_TYPES, EDGE_TYPES } from "../core/types.js";
import type { ExportFile } from "./claude.js";

const DIALECT = "https://json-schema.org/draft/2020-12/schema";
const strList = { type: "array", items: { type: "string" } } as const;

/** The §2 canonical asset envelope as a JSON Schema. */
function assetSchema(): unknown {
  return {
    $schema: DIALECT,
    $id: "ada:asset",
    title: "Context-bearing asset (export envelope §2)",
    type: "object",
    required: ["id", "family", "purpose", "lifecycle"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      family: { type: "string" },
      purpose: { type: "string" },
      scope: {
        type: "object",
        properties: {
          includes: strList,
          excludes: strList,
          authority_level: {
            type: "string",
            enum: ["advisory", "executable", "gated", "autonomous"],
          },
        },
      },
      contents: {
        type: "object",
        properties: {
          facts: strList,
          claims: strList,
          assumptions: strList,
          constraints: strList,
          unknowns: strList,
          decisions: strList,
          actions: strList,
        },
      },
      provenance: {
        type: "object",
        properties: {
          sources: strList,
          compiler: { type: "string" },
          parent_compile_id: { type: ["string", "null"] },
        },
      },
      verification: {
        type: "object",
        properties: { required_checks: strList, acceptance_criteria: strList },
      },
      lifecycle: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: [
              "hole",
              "draft",
              "admissible",
              "verified",
              "frozen",
              "stale",
              "rejected",
              "superseded",
            ],
          },
          recompile_triggers: strList,
        },
      },
    },
  };
}

/** The typed node as a JSON Schema — semanticType/truth/checkClass sourced from the real enums. */
function nodeSchema(): unknown {
  return {
    $schema: DIALECT,
    $id: "ada:node",
    title: "Typed world-model node",
    type: "object",
    required: ["id", "label", "truth"],
    properties: {
      id: { type: "string" },
      label: { type: "string" },
      semanticType: { type: "string", enum: [...NODE_TYPES] },
      truth: { type: "string", enum: ["source", "inference", "residue"] },
      checkClass: {
        type: "string",
        enum: ["C0", "C1", "C2", "C3", "C4", "C5"],
      },
    },
  };
}

/** The typed edge as a JSON Schema — type sourced from the real EDGE_TYPES vocabulary. */
function edgeSchema(): unknown {
  return {
    $schema: DIALECT,
    $id: "ada:edge",
    title: "Typed cross-edge",
    type: "object",
    required: ["from", "to", "type"],
    properties: {
      from: { type: "string" },
      to: { type: "string" },
      type: { type: "string", enum: [...EDGE_TYPES] },
      note: { type: "string" },
    },
  };
}

/** Emit the schemas-IR set: asset envelope + node + edge, as machine JSON Schemas. */
export function projectSchemas(_model: PackModel): ExportFile[] {
  const j = (v: unknown): string => JSON.stringify(v, null, 2) + "\n";
  return [
    { path: "schemas/asset.schema.json", content: j(assetSchema()) },
    { path: "schemas/node.schema.json", content: j(nodeSchema()) },
    { path: "schemas/edge.schema.json", content: j(edgeSchema()) },
  ];
}
