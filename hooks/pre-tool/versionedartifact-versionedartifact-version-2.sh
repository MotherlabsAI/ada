#!/bin/bash
# Invariant: versionedArtifact.version >= 2
# Entity: VersionedArtifact
# Description: int-rerun artifacts start at v2; v1 is always the prior run
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: versionedArtifact.version >= 2
exit 0
