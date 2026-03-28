#!/bin/bash
# Invariant: pipelineRunRecord.passOrdinal >= 1
# Entity: PipelineRunRecord
# Description: pass ordinal tracks which iteration this is; zero or negative ordinals are structurally invalid and make iteration ordering undefined
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineRunRecord.passOrdinal >= 1
exit 0
