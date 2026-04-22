/**
 * ExecutionRegistry + routePrompt
 *
 * Ported in shape from claw-code's Python execution_registry + runtime.route_prompt.
 * Self-contained: no deps, no command imports, no side effects.
 *
 * The registry is a pure dispatch table. index.ts builds it by calling
 * `register(...)` for each command; natural-language routing scores a user
 * prompt against each entry's name/aliases/keywords.
 */

export interface CommandEntry {
  readonly name: string;
  readonly summary: string;
  readonly usage: string;
  readonly aliases?: readonly string[];
  readonly keywords?: readonly string[];
  readonly handler: (args: string[], flags: Set<string>) => Promise<void>;
}

export interface RoutedMatch {
  readonly entry: CommandEntry;
  readonly score: number;
}

const DEFAULT_ROUTE_LIMIT = 5;

export class ExecutionRegistry {
  private readonly entries: CommandEntry[] = [];
  private readonly byKey = new Map<string, CommandEntry>();

  register(entry: CommandEntry): void {
    const primary = entry.name.toLowerCase();
    if (this.byKey.has(primary)) {
      throw new Error(`ExecutionRegistry: duplicate command name '${entry.name}'`);
    }
    this.byKey.set(primary, entry);
    for (const alias of entry.aliases ?? []) {
      const key = alias.toLowerCase();
      if (this.byKey.has(key)) {
        throw new Error(
          `ExecutionRegistry: alias '${alias}' for '${entry.name}' collides with existing entry`,
        );
      }
      this.byKey.set(key, entry);
    }
    this.entries.push(entry);
  }

  find(name: string): CommandEntry | undefined {
    return this.byKey.get(name.toLowerCase());
  }

  all(): readonly CommandEntry[] {
    return this.entries;
  }

  help(commandName?: string): string {
    if (commandName) {
      const entry = this.find(commandName);
      if (!entry) {
        return `Unknown command: ${commandName}`;
      }
      const lines = [entry.usage, entry.summary];
      if (entry.aliases && entry.aliases.length > 0) {
        lines.push(`aliases: ${entry.aliases.join(', ')}`);
      }
      return lines.join('\n');
    }

    const sorted = [...this.entries].sort((a, b) => a.name.localeCompare(b.name));
    if (sorted.length === 0) {
      return 'No commands registered.';
    }
    const nameWidth = Math.max(...sorted.map((e) => e.name.length));
    return sorted.map((e) => `${e.name.padEnd(nameWidth)}  ${e.summary}`).join('\n');
  }
}

/**
 * Tokenize a prompt: lowercase, split on whitespace, '-', '/'. Returns a Set
 * of non-empty tokens suitable for substring scoring.
 */
function tokenize(prompt: string): Set<string> {
  const parts = prompt.toLowerCase().split(/[\s\-/]+/);
  const tokens = new Set<string>();
  for (const part of parts) {
    if (part.length > 0) tokens.add(part);
  }
  return tokens;
}

function scoreEntry(tokens: Set<string>, entry: CommandEntry): number {
  const haystacks: string[] = [entry.name.toLowerCase()];
  for (const alias of entry.aliases ?? []) haystacks.push(alias.toLowerCase());
  for (const keyword of entry.keywords ?? []) haystacks.push(keyword.toLowerCase());

  let score = 0;
  for (const token of tokens) {
    for (const hay of haystacks) {
      if (hay.includes(token)) {
        score += 1;
        break;
      }
    }
  }
  return score;
}

export function routePrompt(
  registry: ExecutionRegistry,
  prompt: string,
  limit: number = DEFAULT_ROUTE_LIMIT,
): RoutedMatch[] {
  const tokens = tokenize(prompt);
  if (tokens.size === 0 || limit <= 0) return [];

  const matches: RoutedMatch[] = [];
  for (const entry of registry.all()) {
    const score = scoreEntry(tokens, entry);
    if (score >= 1) {
      matches.push({ entry, score });
    }
  }

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.entry.name.localeCompare(b.entry.name);
  });

  return matches.slice(0, limit);
}
