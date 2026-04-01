#!/bin/bash
# Invariant: delegationContract.maxRecursionDepth >= 1
# Entity: DelegationContract
# Description: a contract with depth 0 cannot spawn any sub-agents — delegating with depth 0 is a protocol violation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: delegationContract.maxRecursionDepth >= 1
exit 0
