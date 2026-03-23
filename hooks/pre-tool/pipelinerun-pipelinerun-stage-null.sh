#!/bin/bash
# Invariant: pipelineRun.stage !== null
# Entity: PipelineRun
# Description: stage designation is never absent
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineRun.stage !== null
exit 0
