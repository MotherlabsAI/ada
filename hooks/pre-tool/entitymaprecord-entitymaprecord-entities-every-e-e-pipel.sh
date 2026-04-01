#!/bin/bash
# Invariant: entityMapRecord.entities.every(e => e.pipelineRunId === entityMapRecord.pipelineRunId)
# Entity: EntityMapRecord
# Description: all entity registrations must belong to the same pipeline run — cross-run contamination is invalid
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMapRecord.entities.every(e => e.pipelineRunId === entityMapRecord.pipelineRunId)
exit 0
