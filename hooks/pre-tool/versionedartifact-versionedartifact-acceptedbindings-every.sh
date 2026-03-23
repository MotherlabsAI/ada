#!/bin/bash
# Invariant: versionedArtifact.acceptedBindings.every(b => b.entropy.value < 0.30)
# Entity: VersionedArtifact
# Description: every accepted binding has entropy strictly below the hard threshold
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: versionedArtifact.acceptedBindings.every(b => b.entropy.value < 0.30)
exit 0
