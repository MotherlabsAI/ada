#!/bin/bash
# Invariant: delegationContract.stopConditions.length >= 1
# Entity: DelegationContract
# Description: a contract with no stop conditions has no termination criteria — the agent cannot know when to exit
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: delegationContract.stopConditions.length >= 1
exit 0
