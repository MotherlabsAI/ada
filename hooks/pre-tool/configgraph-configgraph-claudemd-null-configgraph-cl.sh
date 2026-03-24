#!/bin/bash
# Invariant: configGraph.claudeMd !== null && configGraph.claudeMd.length > 0
# Entity: ConfigGraph
# Description: Config graph must carry a root configuration document — without it the agent configuration is incomplete
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: configGraph.claudeMd !== null && configGraph.claudeMd.length > 0
exit 0
