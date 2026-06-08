/**
 * Terminal safety net (TERM.001, production-ready). Ink restores the terminal on its own clean
 * exit, but a SIGTERM (`kill`) or an uncaught async error can bypass that and leave the user's
 * shell in raw mode + the alternate screen — broken until they run `reset`. `restoreTerminal`
 * puts the terminal back to a sane state, and is safe to call any number of times and on a
 * non-TTY (it writes nothing into a pipe). Wire it to `process.on('exit')` + SIGTERM so EVERY
 * exit path restores, whatever caused it.
 */

interface OutLike {
  write: (s: string) => void;
  isTTY?: boolean;
}
interface InLike {
  isTTY?: boolean;
  setRawMode?: (mode: boolean) => void;
}

// Leave the alternate screen buffer + show the cursor. These are no-ops on a terminal that
// never entered alt-screen, so calling on a normal exit is harmless.
const LEAVE_ALT_SCREEN = "\x1b[?1049l";
const SHOW_CURSOR = "\x1b[?25h";

/**
 * Restore a terminal to a sane state: leave the alternate screen, show the cursor, disable raw
 * mode. Guards on `isTTY` so a piped/redirected stdout never gets escape bytes injected.
 */
export function restoreTerminal(
  stdout: OutLike = process.stdout,
  stdin: InLike = process.stdin,
): void {
  if (stdout.isTTY) stdout.write(LEAVE_ALT_SCREEN + SHOW_CURSOR);
  if (stdin.isTTY && typeof stdin.setRawMode === "function") {
    try {
      stdin.setRawMode(false);
    } catch {
      // The stream may already be torn down (closed during exit) — nothing to do.
    }
  }
}

/**
 * Arm the safety net for an interactive TUI session: restore the terminal on `exit` (covers an
 * uncaught-exception-induced crash — the handler runs synchronously after Node prints the error)
 * and on SIGTERM (a clean `kill`). Returns a `disarm()` to remove the handlers on a normal exit.
 */
export function armTerminalRestore(): () => void {
  const onExit = () => restoreTerminal();
  const onSigterm = () => {
    restoreTerminal();
    process.exit(143); // 128 + SIGTERM(15)
  };
  process.on("exit", onExit);
  process.once("SIGTERM", onSigterm);
  return () => {
    process.removeListener("exit", onExit);
    process.removeListener("SIGTERM", onSigterm);
  };
}
