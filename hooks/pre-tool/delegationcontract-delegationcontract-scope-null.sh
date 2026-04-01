#!/bin/bash
# Invariant: delegationContract.scope !== null
# Entity: DelegationContract
# Description: a contract with no scope allows unbounded file access — scope is a required governance constraint
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: delegationContract.scope !== null
exit 0
