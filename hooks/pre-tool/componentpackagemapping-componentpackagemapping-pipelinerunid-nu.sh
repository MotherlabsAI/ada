#!/bin/bash
# Invariant: componentPackageMapping.pipelineRunId !== null && componentPackageMapping.pipelineRunId.length > 0
# Entity: ComponentPackageMapping
# Description: pipelineRunId must be non-null — the mapping must be anchored to a specific run
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: componentPackageMapping.pipelineRunId !== null && componentPackageMapping.pipelineRunId.length > 0
exit 0
