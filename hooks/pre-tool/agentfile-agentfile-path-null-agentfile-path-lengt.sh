#!/bin/bash
# Invariant: agentFile.path !== null && agentFile.path.length > 0
# Entity: AgentFile
# Description: Agent must have a file path — pathless agents cannot be written to the config output
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: agentFile.path !== null && agentFile.path.length > 0
exit 0
