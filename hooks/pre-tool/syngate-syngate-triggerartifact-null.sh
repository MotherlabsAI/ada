#!/bin/bash
# Invariant: synGate.triggerArtifact !== null
# Entity: SYNGate
# Description: SYN gate re-evaluation must be triggered against a specific written artifact, never speculatively
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: synGate.triggerArtifact !== null
exit 0
