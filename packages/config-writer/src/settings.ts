import type { HookScript } from "./types.js";

interface HookEntry {
  readonly type: "command";
  readonly command: string;
}

interface MatcherEntry {
  readonly matcher: string;
  readonly hooks: readonly HookEntry[];
}

interface Settings {
  readonly hooks: {
    readonly PreToolUse: readonly MatcherEntry[];
    readonly PostToolUse: readonly MatcherEntry[];
    readonly SessionStart: readonly { readonly hooks: readonly HookEntry[] }[];
  };
  readonly mcpServers: Record<string, { readonly command: string; readonly args: readonly string[] }>;
  readonly model: string;
  readonly largeContextModel: string;
}

export function buildSettings(hooks: readonly HookScript[]): Settings {
  const preToolByMatcher = new Map<string, HookEntry[]>();
  const postToolByMatcher = new Map<string, HookEntry[]>();

  for (const hook of hooks) {
    const entry: HookEntry = { type: "command", command: hook.path };
    if (hook.type === "pre-tool") {
      const existing = preToolByMatcher.get(hook.matcher) ?? [];
      existing.push(entry);
      preToolByMatcher.set(hook.matcher, existing);
    } else {
      const existing = postToolByMatcher.get(hook.matcher) ?? [];
      existing.push(entry);
      postToolByMatcher.set(hook.matcher, existing);
    }
  }

  const preToolUse: MatcherEntry[] = [];
  for (const [matcher, entries] of preToolByMatcher) {
    preToolUse.push({ matcher, hooks: entries });
  }

  const postToolUse: MatcherEntry[] = [];
  for (const [matcher, entries] of postToolByMatcher) {
    postToolUse.push({ matcher, hooks: entries });
  }

  return {
    hooks: {
      PreToolUse: preToolUse,
      PostToolUse: postToolUse,
      SessionStart: [
        { hooks: [{ type: "command", command: "hooks/session-start.sh" }] },
      ],
    },
    mcpServers: {
      ada: { command: "ada mcp", args: [] },
    },
    model: "claude-sonnet-4-6",
    largeContextModel: "claude-opus-4-6",
  };
}
