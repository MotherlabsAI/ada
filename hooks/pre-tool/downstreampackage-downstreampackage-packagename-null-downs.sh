#!/bin/bash
# Invariant: downstreamPackage.packageName !== null && downstreamPackage.packageName.length > 0
# Entity: DownstreamPackage
# Description: downstream package must be named
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: downstreamPackage.packageName !== null && downstreamPackage.packageName.length > 0
exit 0
