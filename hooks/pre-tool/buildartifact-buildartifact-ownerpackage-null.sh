#!/bin/bash
# Invariant: buildArtifact.ownerPackage !== null
# Entity: BuildArtifact
# Description: artifact must be traceable to an owner package
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: buildArtifact.ownerPackage !== null
exit 0
