#!/bin/bash
# Invariant: configGraph.agents !== null
# Entity: ConfigGraph
# Description: Agents array must exist — even empty, it is required for config graph completeness
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: configGraph.agents !== null
exit 0
