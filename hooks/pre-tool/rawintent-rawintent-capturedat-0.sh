#!/bin/bash
# Invariant: rawIntent.capturedAt > 0
# Entity: RawIntent
# Description: Capture must be timestamped — unordered raw intent records corrupt session sequencing
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: rawIntent.capturedAt > 0
exit 0
