#!/bin/bash
# Invariant: run.runId === 'ML.ENT.e80e3c97/v1'
# Entity: StalledPipelineRun
# Description: this artifact is specifically the named stalled run — any other runId is a different pipeline execution
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: run.runId === 'ML.ENT.e80e3c97/v1'
exit 0
