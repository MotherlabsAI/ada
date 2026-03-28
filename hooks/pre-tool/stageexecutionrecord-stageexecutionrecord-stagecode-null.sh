#!/bin/bash
# Invariant: stageExecutionRecord.stageCode !== null
# Entity: StageExecutionRecord
# Description: without a stageCode the record cannot be ordered within the CompilationRun or referenced by provenance chains
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stageExecutionRecord.stageCode !== null
exit 0
