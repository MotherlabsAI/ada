#!/bin/bash
# Invariant: Object.isFrozen(versionedArtifact)
# Entity: VersionedArtifact
# Description: versioned artifacts are immutable; no field may be updated after write
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: Object.isFrozen(versionedArtifact)
exit 0
