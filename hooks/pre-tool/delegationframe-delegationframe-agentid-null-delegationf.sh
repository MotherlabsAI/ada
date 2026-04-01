#!/bin/bash
# Invariant: delegationFrame.agentId !== null && delegationFrame.agentId.length > 0
# Entity: DelegationFrame
# Description: every active delegation must identify the agent holding it
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: delegationFrame.agentId !== null && delegationFrame.agentId.length > 0
exit 0
