#!/bin/bash
# Invariant: registration.pipelineRunId !== null
# Entity: ENTEntityRegistration
# Description: registration must be anchored to its pipeline run — unanchored registrations cannot be attributed to ML.ENT.e80e3c97/v1
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: registration.pipelineRunId !== null
exit 0
