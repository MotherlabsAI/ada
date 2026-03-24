#!/bin/bash
# Invariant: runArtifact.stageLabel !== null && runArtifact.stageLabel.length > 0
# Entity: RunArtifact
# Description: Artifact must declare its stage — a stageless artifact cannot be placed in run history
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runArtifact.stageLabel !== null && runArtifact.stageLabel.length > 0
exit 0
