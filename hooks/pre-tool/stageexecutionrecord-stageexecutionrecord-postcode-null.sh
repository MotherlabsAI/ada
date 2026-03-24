#!/bin/bash
# Invariant: stageExecutionRecord.postcode !== null
# Entity: StageExecutionRecord
# Description: Stage execution must carry a postcode — without it the record cannot be linked in the provenance chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stageExecutionRecord.postcode !== null
exit 0
