#!/bin/bash
# Invariant: pnpmRecursiveRun.scriptName !== null && pnpmRecursiveRun.scriptName.length > 0
# Entity: PnpmRecursiveRun
# Description: recursive run must target a named script
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pnpmRecursiveRun.scriptName !== null && pnpmRecursiveRun.scriptName.length > 0
exit 0
