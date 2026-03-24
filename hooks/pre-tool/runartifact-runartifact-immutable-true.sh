#!/bin/bash
# Invariant: runArtifact.immutable === true
# Entity: RunArtifact
# Description: All run artifacts are immutable — mutable artifacts corrupt the provenance chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runArtifact.immutable === true
exit 0
