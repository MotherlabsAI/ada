#!/usr/bin/env node
/** Emit the engineered reference node L2C.001 into a pack. Usage: emit-l2c-001 [slug] */
import { emitL2C001 } from "../compile/engineered/emit.js";
import { paint, dim, bold } from "../core/grammar.js";

const slug = process.argv[2] ?? "showcase";
const written = await emitL2C001(process.cwd(), slug);
console.log(
  paint("◇ engineered", "terracotta") + dim(`  L2C.001 → pack "${slug}"`),
);
console.log(`  ${bold(String(written.length))} files written:`);
for (const f of written) console.log("    " + dim(f));
console.log("");
console.log(
  "  " +
    paint("read it", "deep_blue") +
    dim(`   node dist/cli.js deeper ${slug} L2C.001`),
);
console.log(
  "  " +
    paint("run its C", "green") +
    dim(`   node .ada/packs/${slug}/c/checks/entity/verify-l2c-001.mjs`),
);
