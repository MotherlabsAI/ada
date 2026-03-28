#!/bin/bash
# Invariant: entGateRecord.passed === false || entGateRecord.governorDecisionPostcode !== null
# Entity: ENTGateRecord
# Description: a passing gate must reference the governor decision postcode that authorized it; G5 three-hop provenance requires this link
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entGateRecord.passed === false || entGateRecord.governorDecisionPostcode !== null
exit 0
