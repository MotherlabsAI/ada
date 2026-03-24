#!/bin/bash
# Invariant: pipelineRun.stage !== null && pipelineRun.stage.length > 0
# Entity: PipelineRun
# Description: Run must declare its stage — a stageless run cannot be placed in the compilation sequence
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineRun.stage !== null && pipelineRun.stage.length > 0
exit 0
