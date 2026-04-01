#!/bin/bash
# Invariant: runRecord.intent !== null && runRecord.intent.length > 0
# Entity: RunRecord
# Description: intent must be preserved in the run record to enable fixed-point detection across recompilations
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runRecord.intent !== null && runRecord.intent.length > 0
exit 0
