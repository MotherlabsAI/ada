#!/bin/bash
# Invariant: delegationContract.compiledAt > 0
# Entity: DelegationContract
# Description: contracts must record their compilation timestamp — undated contracts cannot be audited for freshness
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: delegationContract.compiledAt > 0
exit 0
