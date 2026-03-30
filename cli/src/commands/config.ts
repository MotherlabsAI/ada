import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as readline from "readline";
import Anthropic from "@anthropic-ai/sdk";

interface APIKeyConfiguration {
  readonly keyValue: string;
  readonly source: "CLI_FLAG" | "ENV_VAR";
  readonly provider: string;
}

interface ConfigFile {
  providers: Record<string, { keyValue: string; source: string }>;
}

const KNOWN_PROVIDERS: Record<string, RegExp> = {
  anthropic: /^sk-ant-/,
  openai: /^sk-/,
};

function resolveConfigPath(override?: string): string {
  if (override) return override;
  const home = os.homedir();
  if (!home) {
    process.stderr.write(
      "Error: HOME_DIR_UNRESOLVABLE — use --config-path to specify path\n",
    );
    process.exit(2);
  }
  return path.join(home, ".ada", "config.json");
}

function promptConfirm(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

async function verifyKeyLiveness(
  provider: string,
  keyValue: string,
): Promise<boolean> {
  if (provider === "anthropic") {
    try {
      const client = new Anthropic({ apiKey: keyValue });
      await client.models.list();
      return true;
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 401) {
        process.stderr.write(
          "Error: KEY_INVALID — provider rejected the key (401)\n",
        );
        process.exit(3);
      }
      // Network timeout or other — mark unverified, continue
      process.stderr.write(
        "Warning: LIVENESS_CHECK_SKIPPED_OFFLINE — provider unreachable\n",
      );
      return false;
    }
  }
  process.stderr.write(
    "Warning: LIVENESS_CHECK_SKIPPED_OFFLINE — no liveness check for provider\n",
  );
  return false;
}

async function promptForKey(): Promise<string> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question("  Anthropic API key (sk-ant-...): ", (answer) => {
      rl.close();
      const key = answer.trim();
      if (!key) {
        reject(new Error("no key entered"));
      } else {
        resolve(key);
      }
    });
  });
}

export async function configCommand(argv: string[]): Promise<void> {
  const sub = argv[0];
  if (sub !== "set-key") {
    process.stderr.write(`Unknown config subcommand: ${sub ?? "(none)"}\n`);
    process.stderr.write(
      "Usage: ada config set-key              (interactive)\n",
    );
    process.stderr.write(
      "       ada config set-key --key sk-ant-...  (inline)\n",
    );
    process.exit(1);
    return;
  }

  const rest = argv.slice(1);
  const get = (flag: string): string | undefined => {
    const idx = rest.indexOf(flag);
    return idx !== -1 ? rest[idx + 1] : undefined;
  };
  const has = (flag: string): boolean => rest.includes(flag);

  const noVerify = has("--no-verify");
  const configPath = get("--config-path");

  // ── Interactive shortcut: ada config set-key (no flags) ──────────────────
  // Assumes Anthropic. Prompts for the key value. Simple first-run flow.
  if (rest.length === 0 || (rest.length === 1 && rest[0] === "--no-verify")) {
    let keyValue: string;
    try {
      console.log("\n  ◈ ada — save your Anthropic API key\n");
      keyValue = await promptForKey();
      console.log("");
    } catch {
      process.stderr.write("  no key entered — cancelled.\n");
      process.exit(1);
      return;
    }

    const filePath = resolveConfigPath(configPath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    let existing: ConfigFile = { providers: {} };
    if (fs.existsSync(filePath)) {
      try {
        existing = JSON.parse(fs.readFileSync(filePath, "utf8")) as ConfigFile;
      } catch {
        existing = { providers: {} };
      }
    }
    fs.writeFileSync(
      filePath,
      JSON.stringify(
        {
          providers: {
            ...existing.providers,
            anthropic: { keyValue, source: "CLI_FLAG" },
          },
        },
        null,
        2,
      ),
      { encoding: "utf8", mode: 0o600 },
    );
    try {
      fs.chmodSync(filePath, 0o600);
    } catch {
      /* ignore */
    }

    if (!noVerify) {
      process.stdout.write("  verifying key...\n");
      await verifyKeyLiveness("anthropic", keyValue);
    }
    console.log(`  ◈ key saved. Ada will use it automatically.\n`);
    return;
  }

  // ── Flag-based path (existing behavior) ──────────────────────────────────
  const provider = get("--provider");
  const keyFlag = get("--key");
  const envFlag = get("--env");

  if (!provider) {
    process.stderr.write("Error: --provider is required\n");
    process.exit(1);
    return;
  }

  // Resolve key source
  if (keyFlag !== undefined && envFlag !== undefined) {
    process.stderr.write(
      "Error: AMBIGUOUS_KEY_SOURCE — use either --key or --env, not both\n",
    );
    process.exit(1);
    return;
  }
  if (keyFlag === undefined && envFlag === undefined) {
    process.stderr.write(
      "Error: NO_KEY_SOURCE — provide --key <value> or --env <VAR>\n",
    );
    process.stderr.write(
      "Usage: ada config set-key --provider <name> --key <value>\n",
    );
    process.exit(1);
    return;
  }

  let keyValue: string;
  let source: "CLI_FLAG" | "ENV_VAR";

  if (keyFlag !== undefined) {
    keyValue = keyFlag;
    source = "CLI_FLAG";
  } else {
    const envName = envFlag!;
    const envValue = process.env[envName];
    if (!envValue) {
      process.stderr.write(
        `Error: ENV_VAR_NOT_FOUND — ${envName} is not set\n`,
      );
      const hints = Object.keys(process.env)
        .filter(
          (k) =>
            k.startsWith("ADA_") ||
            k.startsWith("ANTHROPIC_") ||
            k.startsWith("OPENAI_"),
        )
        .slice(0, 5);
      if (hints.length > 0)
        process.stderr.write(`  Hint: found ${hints.join(", ")}\n`);
      process.exit(1);
      return;
    }
    keyValue = envValue;
    source = "ENV_VAR";
  }

  // Validate format
  const normalizedProvider = provider.toLowerCase();
  const pattern = KNOWN_PROVIDERS[normalizedProvider];
  if (!pattern) {
    process.stderr.write(
      `Warning: UNKNOWN_PROVIDER — ${provider} is unrecognized, skipping format check\n`,
    );
  } else if (!pattern.test(keyValue)) {
    process.stderr.write(
      `Warning: KEY_FORMAT_SUSPICIOUS — key does not match expected format for ${provider}\n`,
    );
    const confirmed = await promptConfirm("Continue anyway? (y/n) ");
    if (!confirmed) {
      process.exit(1);
      return;
    }
  }

  const config: APIKeyConfiguration = {
    keyValue,
    source,
    provider: normalizedProvider,
  };

  // Persist
  const filePath = resolveConfigPath(configPath);
  const dir = path.dirname(filePath);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    process.stderr.write(
      `Error: CONFIG_WRITE_DENIED — could not create ${dir}\n`,
    );
    process.exit(2);
    return;
  }

  let existing: ConfigFile = { providers: {} };
  if (fs.existsSync(filePath)) {
    try {
      existing = JSON.parse(fs.readFileSync(filePath, "utf8")) as ConfigFile;
    } catch {
      const backupPath = filePath + ".bak";
      fs.copyFileSync(filePath, backupPath);
      process.stderr.write(
        `Warning: CONFIG_BACKUP_CREATED — malformed config backed up to ${backupPath}\n`,
      );
      existing = { providers: {} };
    }
  }

  const updated: ConfigFile = {
    providers: {
      ...existing.providers,
      [config.provider]: { keyValue: config.keyValue, source: config.source },
    },
  };

  try {
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), {
      encoding: "utf8",
      mode: 0o600,
    });
    // Enforce 0600 explicitly (in case umask overrides)
    try {
      fs.chmodSync(filePath, 0o600);
    } catch {
      process.stderr.write(
        "Warning: INSECURE_KEY_FILE_PERMISSIONS — chmod failed\n",
      );
    }
  } catch {
    process.stderr.write(
      `Error: CONFIG_WRITE_DENIED — could not write to ${filePath}\n`,
    );
    process.exit(2);
    return;
  }

  // Verify liveness
  if (!noVerify) {
    process.stderr.write(`  Verifying key with ${config.provider}...\n`);
    await verifyKeyLiveness(config.provider, config.keyValue);
  } else {
    process.stderr.write(
      "Warning: KEY_NOT_VERIFIED — skipping liveness check\n",
    );
  }

  process.stderr.write(
    `\n  Key saved: provider=${config.provider} source=${config.source} path=${filePath}\n`,
  );
}
