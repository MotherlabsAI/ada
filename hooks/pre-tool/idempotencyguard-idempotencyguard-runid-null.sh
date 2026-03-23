#!/bin/bash
# Invariant: idempotencyGuard.runId !== null
# Entity: IdempotencyGuard
# Description: guard must be keyed to a specific run ID
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: idempotencyGuard.runId !== null
exit 0
