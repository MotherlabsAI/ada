#!/bin/bash
# Invariant: stageExecutionRecord.metadata !== null
# Entity: StageExecutionRecord
# Description: determinism metadata must be captured for all LLM stages — missing metadata prevents reproducibility auditing
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stageExecutionRecord.metadata !== null
exit 0
