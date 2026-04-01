#!/bin/bash
# Invariant: agentFile.tools.length >= 1
# Entity: AgentFile
# Description: every agent must declare at least one tool — toolless agents cannot interact with the world-state
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: agentFile.tools.length >= 1
exit 0
