# Ada Troubleshooting

Each entry: symptom → cause → fix.

## Install & build

- **`pnpm install` completes but ignores native build scripts.**
  Cause: pnpm 10 requires explicit `onlyBuiltDependencies` opt-in.
  Fix: root `package.json` declares `"pnpm": { "onlyBuiltDependencies": ["better-sqlite3", "esbuild", "sharp"] }`. Run `pnpm install --force`.

- **`cli` build fails with `Cannot find module '../world-model.js'`.**
  Cause: file was dropped from a recent commit.
  Fix: restore from git blob `8b7866d` or an earlier commit.

- **`better-sqlite3` ABI mismatch after Node upgrade.**
  Fix: `pnpm rebuild better-sqlite3`.

## Running

- **`ada init` completes then nothing happens (Linux).**
  Cause: `osascript` is macOS-only; `init.ts` auto-spawn silently fails on Linux.
  Fix: pass `--no-execute` and launch `claude` manually. Goes away once the Linux spawn branch lands.

- **`ada compile` sits silent for 30+ seconds.**
  Not a bug: each LLM stage takes 3–15s, eight stages total.
  Fix (tracked in ROADMAP): wire `onStageToken` in `compile.ts` for a live token stream.

- **`ada: command not found` after install.**
  Fix: ensure `~/.nvm/versions/node/*/bin` is in `$PATH`, or run `pnpm setup`.

## Config

- **`ada config set-key` errors with `KEY_INVALID 401`.**
  Cause: provider rejected the key.
  Fix: regenerate the key with the provider.

- **`ada config set-key` warns `LIVENESS_CHECK_SKIPPED_OFFLINE`.**
  Cause: transient network failure.
  Fix: re-run when online, or use `--no-verify`.

- **Key stored in plain text.**
  `~/.ada/config.json` is `chmod 0600` but is not encrypted. Treat it as a secrets file. Do not commit.

## Git & identity

- **Commit attribution wrong.**
  Cause: git `user.email` and `gh auth` are separate identities.
  Fix: check `git config user.email` and `gh auth status`.
