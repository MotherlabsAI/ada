#!/bin/bash
# Invariant: agentFile.body !== null && agentFile.body.length > 0
# Entity: AgentFile
# Description: an agent with empty body has no behavioral specification — it cannot govern any execution
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: agentFile.body !== null && agentFile.body.length > 0
exit 0
