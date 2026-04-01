#!/bin/bash
# Invariant: runRecord.durationMs >= 0
# Entity: RunRecord
# Description: duration must be non-negative — negative durations indicate clock errors or record corruption
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runRecord.durationMs >= 0
exit 0
