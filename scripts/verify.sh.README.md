Usage: `./scripts/verify.sh` from anywhere in the ada repo — runs install, build, typecheck, tests, CLI smoke, and `ada doctor`.
Expected runtime: ~2-5 min cold, ~30-60s warm (lockfile hit, incremental build).
Skip flags: `SKIP_INSTALL=1 ./scripts/verify.sh` (deps already installed), `SKIP_TESTS=1 ./scripts/verify.sh` (skip the slow vitest run), `SKIP_DOCTOR=1 ./scripts/verify.sh` (skip env diagnostics). Combine freely.
Exit code 0 on success, 1 on first failing stage; summary with per-stage timings prints on both paths.
Requires bash 4+, `pnpm` on PATH, and the built `ada` binary linked (produced by the `pnpm -r build` stage itself, so a cold run self-bootstraps).
