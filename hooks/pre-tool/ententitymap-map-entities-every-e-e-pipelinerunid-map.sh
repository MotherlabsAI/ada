#!/bin/bash
# Invariant: map.entities.every(e => e.pipelineRunId === map.pipelineRunId)
# Entity: ENTEntityMap
# Description: every registration in the map must belong to the same pipeline run — cross-run contamination is prohibited
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: map.entities.every(e => e.pipelineRunId === map.pipelineRunId)
exit 0
