#!/bin/bash
# Invariant: gate.passed === false || gate.governorDecisionPostcode !== null
# Entity: ENTGateRecord
# Description: a passing gate must have a GovernorDecision postcode — passing without a governance record breaks G6 and the audit trail
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gate.passed === false || gate.governorDecisionPostcode !== null
exit 0
