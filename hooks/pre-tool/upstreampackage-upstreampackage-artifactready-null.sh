#!/bin/bash
# Invariant: upstreamPackage.artifactReady !== null
# Entity: UpstreamPackage
# Description: upstream package must track whether its artifact is ready
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: upstreamPackage.artifactReady !== null
exit 0
