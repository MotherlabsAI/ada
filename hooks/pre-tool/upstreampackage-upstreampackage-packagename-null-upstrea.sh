#!/bin/bash
# Invariant: upstreamPackage.packageName !== null && upstreamPackage.packageName.length > 0
# Entity: UpstreamPackage
# Description: upstream package must be named
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: upstreamPackage.packageName !== null && upstreamPackage.packageName.length > 0
exit 0
