#!/bin/bash
# Invariant: /* immutable after write */true
# Entity: DriftEvent
# Description: drift events are append-only; any mutation after write corrupts the governed audit trail
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: /* immutable after write */true
exit 0
