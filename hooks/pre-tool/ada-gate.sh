#!/bin/bash
# Ada semantic gate — PreToolUse enforcement.
# Invokes the ada-gate-hook binary with the Claude Code tool_input payload.
# Exits 2 on BLOCK (Claude Code shows stderr to the model). Fail-open on
# LLM unavailability unless ADA_GATE_STRICT=1. Disable with ADA_GATE_MODE=off.
if command -v ada-gate-hook >/dev/null 2>&1; then
  exec ada-gate-hook
fi
# ada-gate-hook not installed on PATH — fail-open so the session is not bricked.
exit 0
