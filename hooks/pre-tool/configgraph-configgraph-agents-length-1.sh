#!/bin/bash
# Invariant: configGraph.agents.length >= 1
# Entity: ConfigGraph
# Description: at least one agent file must be produced — a configuration with no agents cannot orchestrate execution
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: configGraph.agents.length >= 1
exit 0
