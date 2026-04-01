#!/bin/bash
# Invariant: entityMap.pipelineRunId !== null
# Entity: EntityMap
# Description: the EntityMap must be tied to exactly one pipeline run; a null runId makes it unreferenceable by the ENTGateRecord for that run
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMap.pipelineRunId !== null
exit 0
