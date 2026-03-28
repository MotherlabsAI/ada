#!/bin/bash
# Invariant: entEntityMap.entities.every(e => e.pipelineRunId === entEntityMap.pipelineRunId)
# Entity: ENTEntityMap
# Description: all registrations must belong to the same pipeline run; cross-run entity registrations corrupt the ENT stage boundary
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entEntityMap.entities.every(e => e.pipelineRunId === entEntityMap.pipelineRunId)
exit 0
