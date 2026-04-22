# Linux Setup & Troubleshooting

Read once after cloning on Linux.

## Prereqs
- Node >= 18 (tested on 20, 22, 25)
- pnpm 10.x
- `build-essential` + `python3` (for `better-sqlite3` node-gyp compile)

On Debian/Ubuntu:
```
sudo apt-get install -y build-essential python3
```

## Install
```
gh repo clone MotherlabsAI/ada && cd ada
pnpm install
```

If native scripts were skipped (pnpm 10 gates them behind `onlyBuiltDependencies`):
```
pnpm install --force
```

The root `package.json` opts `better-sqlite3`, `esbuild`, and `sharp` into the allowlist — no further config needed.

Build the CLI:
```
pnpm -F @ada/cli build
```

Symlink the bin onto your PATH:
```
ln -sfn "$PWD/cli/dist/index.js" ~/.local/bin/ada
```
(Use whichever dir on your PATH — `~/.local/bin` must exist and be on `$PATH`.)

## `ada init` terminal auto-spawn

After compilation reaches ACCEPT, `ada init` writes a temp bash script and opens Claude Code in a new terminal window. On Linux the spawn walks this list in order (first match wins):

1. `$TERMINAL` env var
2. `x-terminal-emulator`
3. `gnome-terminal`
4. `konsole`
5. `xfce4-terminal`
6. `xterm`

If none are found, ada prints the script path — run it yourself:
```
bash /tmp/ada-spawn-<ts>.sh
```

Check your setup with `ada doctor`.

## Known friction
- `better-sqlite3` first install compiles native bindings via node-gyp — ~3 min on a modern machine. Subsequent installs hit the cached build.
- `osascript` references in older `init.ts` were macOS-only. This branch ships the Linux `x-terminal-emulator`/`gnome-terminal`/etc. branch.

## Verifying install
- `ada doctor` — all green/info lines on a healthy Linux box.
- `ada --help` — cold-start < 20 ms (command modules are lazy-loaded).
