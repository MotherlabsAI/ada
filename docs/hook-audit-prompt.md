# Hook Audit — Prompt for Claude

## Context

This is the Ada semantic compiler monorepo at `/Users/motherlabs/Desktop/ada-claude`.

There are ~250 pre-tool hook scripts in `hooks/pre-tool/`. These run before every tool
call (Bash, Edit, Write, etc.) and enforce entity invariants. Claude Code logs
`PreToolUse:Bash hook error` (or similar) whenever a hook exits non-zero.

The problem: these hooks fire on _every_ tool call, not just Ada pipeline calls.
They produce constant error noise in the logs even during unrelated work (building the
website, running tests, etc.). They are not blocking execution but they are noisy and
may be hiding real violations in the signal.

## Your Job

Do NOT rewrite the hooks or change what they check. The invariants are correct.
Your job is to diagnose _why_ they are erroring and fix the specific failure modes.

## Investigation Steps

1. **Run a sample of hooks directly** to see which ones error and why:

   ```bash
   bash hooks/pre-tool/blueprint-blueprint-datamodel-null.sh 2>&1
   bash hooks/pre-tool/compilationrun-compilationrun-runid-null-compilationrun.sh 2>&1
   ```

   A hook that passes exits 0 with no output.
   A hook that fails exits non-zero, possibly with an error message.

2. **Categorize failure modes.** Common causes:
   - Script references a command or file that doesn't exist
   - Script expects environment variables that aren't set during non-Ada tool calls
   - Script has a syntax error
   - Script's invariant check logic has a bug (e.g. wrong exit code for pass/fail)
   - Script is checking pipeline state that only exists during a live Ada run,
     so it always fails when called outside one

3. **Check `.claude/settings.json`** to understand which hooks are registered and
   under what conditions they fire. Hooks that should only fire during Ada pipeline
   runs should be gated accordingly.

4. **Do not suppress errors with `exit 0` everywhere.** That defeats the purpose.
   The fix should be one of:
   - Add a guard that skips the check when not in an active Ada pipeline run
     (e.g. check for an env var like `ADA_PIPELINE_RUN_ID` — if absent, exit 0)
   - Fix a genuine script bug (wrong path, missing command, syntax error)
   - Gate the hook registration in settings.json to only apply to specific tools
     or only when a specific condition is met

5. **After fixing**, verify:
   - A normal `pnpm build` in `apps/website/` produces zero hook errors in the log
   - Running `ada compile` (or the test suite) still triggers the invariant checks
     correctly (a deliberate violation still causes a non-zero exit)

## Constraints

- Do NOT change what the hooks check — only fix _why_ they error outside Ada runs
- Do NOT delete hooks unless they are exact duplicates
- TypeScript compilation across the monorepo must still pass after any changes
- Existing tests must still pass

## Done When

- `pnpm --filter @motherlabs/website build` runs with zero `PreToolUse` errors in log
- Hook invariants still fire correctly during an actual Ada pipeline run
- Root cause of each failure mode is documented in a summary comment at the top
  of any hook file you modify
