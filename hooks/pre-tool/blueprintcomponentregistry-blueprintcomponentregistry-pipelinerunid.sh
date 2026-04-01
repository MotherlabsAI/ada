#!/bin/bash
# Invariant: blueprintComponentRegistry.pipelineRunId !== null && blueprintComponentRegistry.pipelineRunId.length > 0
# Entity: BlueprintComponentRegistry
# Description: pipelineRunId must be non-null — the registry must be anchored to a specific pipeline run
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprintComponentRegistry.pipelineRunId !== null && blueprintComponentRegistry.pipelineRunId.length > 0
exit 0
