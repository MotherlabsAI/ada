#!/bin/bash
# Invariant: delegationContract.context !== null && delegationContract.context.length > 0
# Entity: DelegationContract
# Description: context (bounded context name) must be non-null to scope the agent's domain authority
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: delegationContract.context !== null && delegationContract.context.length > 0
exit 0
