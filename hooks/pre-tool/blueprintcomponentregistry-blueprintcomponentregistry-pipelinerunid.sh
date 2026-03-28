#!/bin/bash
# Invariant: blueprintComponentRegistry.pipelineRunId !== null && blueprintComponentRegistry.pipelineRunId.length > 0
# Entity: BlueprintComponentRegistry
# Description: the registry must be bound to a specific pipeline run; an unbound registry cannot feed ENT gate evaluation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprintComponentRegistry.pipelineRunId !== null && blueprintComponentRegistry.pipelineRunId.length > 0
exit 0
