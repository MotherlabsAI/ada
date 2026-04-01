#!/bin/bash
# Invariant: delegationContract.requiredEvidence.length >= 1
# Entity: DelegationContract
# Description: a contract with no required evidence cannot be verified by the independent verifier
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: delegationContract.requiredEvidence.length >= 1
exit 0
