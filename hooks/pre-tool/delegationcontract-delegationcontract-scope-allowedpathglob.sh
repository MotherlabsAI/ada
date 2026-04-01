#!/bin/bash
# Invariant: delegationContract.scope.allowedPathGlobs.length >= 1
# Entity: DelegationContract
# Description: a contract with no allowed paths grants no write authority — the agent has no actionable scope
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: delegationContract.scope.allowedPathGlobs.length >= 1
exit 0
