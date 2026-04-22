import * as fs from "fs";
import * as path from "path";

export function getDriftAlerts(limit?: number): {
  content: string;
  isError: boolean;
} {
  const alertsPath = path.join(process.cwd(), ".ada", "drift-alerts.jsonl");
  if (!fs.existsSync(alertsPath)) {
    return {
      content:
        "No drift alerts recorded yet. Run ada run to start a governed session.",
      isError: false,
    };
  }

  const lines = fs
    .readFileSync(alertsPath, "utf8")
    .split("\n")
    .filter((l) => l.trim().length > 0);

  const recent = limit !== undefined ? lines.slice(-limit) : lines;
  const alerts = recent
    .map((l) => {
      try {
        return JSON.parse(l) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter((a): a is Record<string, unknown> => a !== null);

  if (alerts.length === 0) {
    return { content: "No drift alerts recorded yet.", isError: false };
  }

  const formatted = alerts
    .map((a) => {
      const ts = typeof a["ts"] === "number" ? a["ts"] : 0;
      const type = typeof a["type"] === "string" ? a["type"] : "unknown";
      const severity =
        typeof a["severity"] === "string" ? ` [${a["severity"]}]` : "";
      const location =
        typeof a["location"] === "string" ? ` ${a["location"]}` : "";
      const detail =
        typeof a["detail"] === "string"
          ? a["detail"]
          : typeof a["reason"] === "string"
            ? a["reason"]
            : "";
      const time = new Date(ts).toISOString().slice(11, 19);
      return `[${time}] ${type}${severity}${location}: ${detail}`;
    })
    .join("\n");

  return {
    content: `${alerts.length} drift alert(s):\n\n${formatted}`,
    isError: false,
  };
}
