#!/bin/bash
# Invariant: pipelineRun.runId !== null && pipelineRun.runId.length > 0
# Entity: PipelineRun
# Description: Run must have identity — anonymous runs cannot be referenced in provenance or parent chains
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineRun.runId !== null && pipelineRun.runId.length > 0
exit 0
