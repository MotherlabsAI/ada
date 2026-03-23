#!/bin/bash
# Invariant: downstreamPackage.upstreamDependencies.length > 0
# Entity: DownstreamPackage
# Description: a downstream package must declare at least one upstream dependency
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: downstreamPackage.upstreamDependencies.length > 0
exit 0
