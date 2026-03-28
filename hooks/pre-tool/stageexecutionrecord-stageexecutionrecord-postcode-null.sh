#!/bin/bash
# Invariant: stageExecutionRecord.postcode !== null
# Entity: StageExecutionRecord
# Description: without a postcode the stage output cannot be linked into any ProvenanceChainHop
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stageExecutionRecord.postcode !== null
exit 0
