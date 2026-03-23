#!/bin/bash
# Invariant: buildStep.outputArtifactPath !== null && buildStep.outputArtifactPath.length > 0
# Entity: BuildStep
# Description: build step must declare a non-empty output path
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: buildStep.outputArtifactPath !== null && buildStep.outputArtifactPath.length > 0
exit 0
