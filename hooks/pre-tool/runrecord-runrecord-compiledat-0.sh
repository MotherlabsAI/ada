#!/bin/bash
# Invariant: runRecord.compiledAt > 0
# Entity: RunRecord
# Description: run records must be timestamped — undated records cannot support chronological audit queries
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runRecord.compiledAt > 0
exit 0
