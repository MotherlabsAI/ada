#!/bin/bash
# Invariant: pipelineRun.runId !== null && pipelineRun.runId.length > 0
# Entity: PipelineRun
# Description: run must have a non-empty runId
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineRun.runId !== null && pipelineRun.runId.length > 0
exit 0
