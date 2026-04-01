#!/bin/bash
# Invariant: configGraph.hooks.length >= 2
# Entity: ConfigGraph
# Description: at least a pre-tool-use and post-tool-use hook must be registered — fewer hooks break session logging and invariant enforcement
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: configGraph.hooks.length >= 2
exit 0
