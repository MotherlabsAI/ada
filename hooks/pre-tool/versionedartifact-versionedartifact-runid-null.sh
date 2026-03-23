#!/bin/bash
# Invariant: versionedArtifact.runId !== null
# Entity: VersionedArtifact
# Description: artifact must reference the originating run ID
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: versionedArtifact.runId !== null
exit 0
