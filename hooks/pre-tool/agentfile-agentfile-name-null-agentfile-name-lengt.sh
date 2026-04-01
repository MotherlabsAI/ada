#!/bin/bash
# Invariant: agentFile.name !== null && agentFile.name.length > 0
# Entity: AgentFile
# Description: agent files must be named — the name is the identifier used in delegation contracts and macro plans
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: agentFile.name !== null && agentFile.name.length > 0
exit 0
