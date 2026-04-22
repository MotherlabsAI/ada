import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages/messages.js";
import { OPUS_4_7 } from "@ada/compiler";

/**
 * ada think — the raw-note auto-compiler.
 *
 * Takes a raw thought (markdown file), runs it through Opus 4.7 with the
 * Ada Wiki schema in context, and emits a proposed wiki entry to a staging
 * directory. Adversarial, research-grounded, structurally integrated.
 *
 * V1 scope: single LLM call, file-in / file-out. No agent swarm yet.
 * No Perplexity yet. No daemon yet. Just: does this shape of compilation
 * produce better structure than manually writing the entry yourself?
 *
 * Usage:
 *   ada think ~/Desktop/ALEX\ WIKI/raw-notes/some-thought.md
 *   ada think <file> --domain ML|RS|PJ|PF
 *   ada think <file> --dry-run     (print to stdout, don't write)
 */

const WIKI_ROOT = path.join(os.homedir(), "Desktop", "ALEX WIKI");
const STAGING = path.join(WIKI_ROOT, "wiki", ".staging");
const INDEX = path.join(WIKI_ROOT, "wiki", "index.md");
const SCHEMA = path.join(WIKI_ROOT, "wiki", "schema.md");
const LAWS = path.join(WIKI_ROOT, "LAWS.md");

interface ThinkArgs {
  readonly file: string;
  readonly domain?: string;
  readonly dryRun: boolean;
}

function parseArgs(argv: readonly string[]): ThinkArgs {
  let file = "";
  let domain: string | undefined;
  let dryRun = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--domain") {
      const val = argv[i + 1];
      if (val !== undefined && !val.startsWith("--")) {
        domain = val;
        i++;
      }
    } else if (a === "--dry-run") {
      dryRun = true;
    } else if (!a.startsWith("--")) {
      if (!file) file = a;
    }
  }
  return {
    file,
    ...(domain !== undefined ? { domain } : {}),
    dryRun,
  };
}

function readIfExists(p: string): string {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

const SYSTEM_PROMPT = `You are the Ada thinking compiler.

You take a raw thought — a note, an idea fragment, a research snippet, a journal entry — and compile it into a structured wiki entry following the Alex Wiki schema (LAWS.md + schema.md will be in context).

Your job, in order:

1. Read the thought rigorously. Extract: (a) what is it claiming, (b) what questions is it raising, (c) what assumptions is it making, (d) what would make it false.

2. Scan the wiki index for related existing articles. The entry you produce MUST link to any existing articles that share entities, concepts, or conclusions. Use actual postcodes from the index.

3. Research the claims where possible. Cite prior art, literature, contradicting views. Do not fabricate sources. If you can't ground a claim, mark it inferred.

4. Challenge the thought adversarially. Every compilation must include a "Challenges" section that states the strongest objections, the weakest link, what would falsify it, and any contradictions with existing wiki content.

5. Structurally integrate. Does this belong in an existing domain (ML/RS/PJ/PF)? Is it a new subtopic? Should any existing article be updated to reference it?

6. Emit the entry. Use the schema's frontmatter format. Use a real postcode format matching the index (e.g., ML.26 if ML currently goes to ML.25). Match the tone and density of existing wiki entries — precise, non-inflated, no marketing language.

Rules:
- Never restate what the thought already said. Extract, research, structure.
- Never invent postcodes that don't follow the numbering.
- Confidence tag mandatory: PROVEN (2+ independent sources), SINGLE (one source), INFERRED (synthesized), STALE.
- Use "Challenges:" as a first-class section, not an afterthought.
- If the thought is too underspecified to compile, return a short markdown explaining what's missing.
- Output format: a single markdown file, nothing before or after. No prose commentary. Just the file content.`;

function buildUserPrompt(
  thought: string,
  thoughtFilename: string,
  schema: string,
  index: string,
  laws: string,
  domain?: string,
): string {
  const domainHint = domain
    ? `\n\nTarget domain: ${domain}. Allocate the next postcode in that domain.`
    : "\n\nDetermine the best domain (ML/RS/PJ/PF) from the thought content. If none fits, propose the new domain in a comment but still pick the closest match.";

  return `# Source note
filename: ${thoughtFilename}
\`\`\`markdown
${thought.slice(0, 12000)}
\`\`\`

# Laws (participation protocol — obey Law 4: never change tense)
\`\`\`
${laws.slice(0, 3500)}
\`\`\`

# Schema (format reference)
\`\`\`
${schema.slice(0, 4000)}
\`\`\`

# Current wiki index (use to find Related postcodes and next available postcode)
\`\`\`
${index.slice(0, 7000)}
\`\`\`
${domainHint}

# Task

Compile this thought into a proposed wiki entry. Return only the markdown file content.`;
}

function usage(): void {
  console.log(
    `Usage: ada think <file> [options]

Options:
  --domain <ML|RS|PJ|PF>  Target domain (default: auto-detect)
  --dry-run               Print result to stdout, do not write to staging

Compiles a raw-notes markdown file into a proposed Alex Wiki entry using
Opus 4.7 with extended thinking. Output is staged in:
  ~/Desktop/ALEX\\ WIKI/wiki/.staging/

Review, then move to the correct domain folder and update index.md.

Requires ANTHROPIC_API_KEY.`,
  );
}

export async function thinkCommand(argv: readonly string[]): Promise<number> {
  const args = parseArgs(argv);

  if (!args.file) {
    usage();
    return 1;
  }

  const filePath = path.resolve(args.file);
  if (!fs.existsSync(filePath)) {
    console.error(`  × file not found: ${filePath}`);
    return 1;
  }

  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) {
    console.error("  × ANTHROPIC_API_KEY not set");
    return 1;
  }

  const thought = fs.readFileSync(filePath, "utf8");
  if (thought.trim().length === 0) {
    console.error("  × file is empty");
    return 1;
  }

  const schema = readIfExists(SCHEMA);
  const index = readIfExists(INDEX);
  const laws = readIfExists(LAWS);

  if (!schema || !index) {
    console.error(
      `  × wiki not found at ${WIKI_ROOT}. Expected schema.md and index.md in wiki/.`,
    );
    return 1;
  }

  console.log(
    `  ◈ compiling ${path.basename(filePath)} (${thought.length} chars)`,
  );
  console.log(
    `    model: ${OPUS_4_7}, thinking: 6000 tokens, schema + index in context`,
  );
  const started = Date.now();

  const client = new Anthropic({ apiKey });

  let response: Message;
  try {
    response = (await client.messages.create({
      model: OPUS_4_7,
      max_tokens: 8192,
      temperature: 1,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserPrompt(
            thought,
            path.basename(filePath),
            schema,
            index,
            laws,
            args.domain,
          ),
        },
      ],
    } as Parameters<typeof client.messages.create>[0])) as Message;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  × compilation failed: ${msg}`);
    return 1;
  }

  const elapsed = Date.now() - started;

  const content = response.content
    .filter((b) => b.type === "text")
    .map((b) => ("text" in b ? String(b.text) : ""))
    .join("\n")
    .trim();

  if (!content) {
    console.error("  × compiler returned no content");
    return 1;
  }

  const tokenUsage = response.usage;
  const usageLine = tokenUsage
    ? `    tokens: in ${tokenUsage.input_tokens ?? "?"}, out ${tokenUsage.output_tokens ?? "?"}`
    : "";

  console.log(`  ◆ compiled in ${elapsed}ms`);
  if (usageLine) console.log(usageLine);

  if (args.dryRun) {
    console.log("\n  ─── dry-run output ───────────────────────────────\n");
    console.log(content);
    console.log("\n  ─── end dry-run ──────────────────────────────────");
    return 0;
  }

  if (!fs.existsSync(STAGING)) fs.mkdirSync(STAGING, { recursive: true });

  const baseName = path.basename(filePath, ".md").replace(/[^\w.-]/g, "_");
  const outName = `${baseName}.compiled.md`;
  const outPath = path.join(STAGING, outName);
  fs.writeFileSync(outPath, content, "utf8");

  console.log(`  ✓ staged: ${outPath}`);
  console.log("");
  console.log("  next: review the file, then if accepted:");
  console.log(
    "    1. move to the correct domain folder (wiki/ML/, wiki/RS/, …)",
  );
  console.log("    2. rename to its real postcode (e.g. ML.26.md)");
  console.log("    3. add the entry line to wiki/index.md");
  console.log("    4. append an INGEST line to wiki/log.md");
  console.log("");

  return 0;
}
