#!/bin/bash
# Invariant: pipelineRun.version !== null && pipelineRun.version.length > 0
# Entity: PipelineRun
# Description: run must have a non-empty version string
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineRun.version !== null && pipelineRun.version.length > 0
exit 0
