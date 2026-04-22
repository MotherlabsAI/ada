// SIGINT / SIGTERM coordination for the ada CLI.
//
// Commands register cleanup fns via `onCancel`. When the user hits Ctrl-C,
// every registered handler runs in LIFO order with a per-handler 2 s timeout,
// then the process exits with code 130 (standard for interrupted-by-SIGINT).
//
// If the user hits Ctrl-C a second time while handlers are still running,
// we skip the rest and force-exit. This is the escape hatch for a handler
// that hangs on a socket, lock file, or similar.

type CleanupFn = () => void | Promise<void>;

const handlers: CleanupFn[] = [];
let installed = false;
let draining = false;
const HANDLER_TIMEOUT_MS = 2000;

/**
 * Register an async or sync cleanup fn to run when SIGINT or SIGTERM is
 * received. Returns an unregister fn. Handlers are LIFO (last-registered
 * runs first) so nested resources tear down in reverse construction order.
 */
export function onCancel(fn: CleanupFn): () => void {
  handlers.push(fn);
  return () => {
    const idx = handlers.lastIndexOf(fn);
    if (idx !== -1) handlers.splice(idx, 1);
  };
}

async function runHandler(fn: CleanupFn): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      Promise.resolve().then(() => fn()),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, HANDLER_TIMEOUT_MS);
      }),
    ]);
  } catch {
    // One bad handler must not block the others.
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function runAllHandlers(): Promise<void> {
  // Drain LIFO. Splice as we go so re-entrant calls see an empty list.
  while (handlers.length > 0) {
    const fn = handlers.pop()!;
    await runHandler(fn);
  }
}

/**
 * Run all registered handlers and clear them. Safe to call from a clean
 * exit path (e.g. after a command finishes) to flush transcripts, db, etc.
 * Idempotent — a second call is a no-op because the handler list is empty.
 */
export async function drainOnExit(): Promise<void> {
  if (draining) return;
  draining = true;
  try {
    await runAllHandlers();
  } finally {
    draining = false;
  }
}

/**
 * Install process.on('SIGINT' | 'SIGTERM') handlers. Call once early from
 * the main entrypoint. Idempotent.
 *
 * First signal: print a notice, run cleanup handlers, exit 130.
 * Second signal while draining: skip remaining handlers and force-exit 130.
 */
export function installSignalHandlers(): void {
  if (installed) return;
  installed = true;

  let interrupted = false;

  const handle = (_signal: NodeJS.Signals) => {
    if (interrupted) {
      // Double-tap: user is telling us a handler is stuck. Bail now.
      process.stderr.write('\n  ⚠ force-exit\n');
      process.exit(130);
    }
    interrupted = true;
    process.stderr.write('\n  ⚠ interrupted — cleaning up…\n');

    runAllHandlers()
      .catch(() => {
        // Swallowed — runHandler already guards each fn; this is defensive.
      })
      .finally(() => {
        process.exit(130);
      });
  };

  process.on('SIGINT', handle);
  process.on('SIGTERM', handle);
}
