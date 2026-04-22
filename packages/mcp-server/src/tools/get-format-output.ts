import * as fs from "fs";
import * as path from "path";

export function getFormatOutput(type?: string): {
  content: string;
  isError: boolean;
} {
  const formatDir = path.join(process.cwd(), ".ada", "format");
  if (!fs.existsSync(formatDir)) {
    return {
      content:
        "No format output found. Run ada compile with a format-forward intent first.",
      isError: true,
    };
  }

  if (type === "schema") {
    const p = path.join(formatDir, "schema.ts");
    return fs.existsSync(p)
      ? { content: fs.readFileSync(p, "utf8"), isError: false }
      : { content: "schema.ts not found in .ada/format/", isError: true };
  }
  if (type === "diagrams") {
    const p = path.join(formatDir, "diagrams.md");
    return fs.existsSync(p)
      ? { content: fs.readFileSync(p, "utf8"), isError: false }
      : { content: "diagrams.md not found in .ada/format/", isError: true };
  }
  if (type === "placement") {
    const p = path.join(formatDir, "placement.md");
    return fs.existsSync(p)
      ? { content: fs.readFileSync(p, "utf8"), isError: false }
      : { content: "placement.md not found in .ada/format/", isError: true };
  }

  // No type — list available files
  const files = fs.readdirSync(formatDir);
  return {
    content: `Format output available:\n${files.map((f) => `  - ${f}`).join("\n")}\n\nUse type parameter: schema | diagrams | placement`,
    isError: false,
  };
}
