#!/bin/bash
# Invariant: stageExecutionRecord.stageCode !== null
# Entity: StageExecutionRecord
# Description: every execution record must identify its stage — anonymous records cannot participate in the provenance chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stageExecutionRecord.stageCode !== null
exit 0
