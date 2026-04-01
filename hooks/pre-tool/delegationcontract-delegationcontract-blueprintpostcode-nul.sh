#!/bin/bash
# Invariant: delegationContract.blueprintPostcode !== null && delegationContract.blueprintPostcode.length > 0
# Entity: DelegationContract
# Description: every contract must reference the blueprint that authorized it — unlinked contracts cannot be verified against governed intent
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: delegationContract.blueprintPostcode !== null && delegationContract.blueprintPostcode.length > 0
exit 0
