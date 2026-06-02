/**
 * Whether the Ink workbench can run here. Ink's `useInput` requires raw mode, which
 * needs a TTY stdin that exposes `setRawMode` AND a TTY stdout. Mirrors Ink's own
 * isRawModeSupported criterion so `ada tui` degrades to the static view instead of
 * flashing a cryptic "Raw mode is not supported" error and dying.
 */
export interface StreamLike {
  isTTY?: boolean;
  setRawMode?: unknown;
}

export function canRunInk(stdin: StreamLike, stdout: StreamLike): boolean {
  return Boolean(
    stdin?.isTTY && stdout?.isTTY && typeof stdin.setRawMode === "function",
  );
}
