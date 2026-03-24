#!/bin/bash
# Invariant: configGraph.agents.length > 0 || configGraph.skills.length > 0
# Entity: ConfigGraph
# Description: Config graph must define at least one agent or skill — an empty config graph configures nothing
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: configGraph.agents.length > 0 || configGraph.skills.length > 0
exit 0
