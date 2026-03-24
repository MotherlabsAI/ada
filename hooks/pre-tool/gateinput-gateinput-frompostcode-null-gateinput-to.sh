#!/bin/bash
# Invariant: gateInput.fromPostcode !== null && gateInput.toPostcode !== null
# Entity: GateInput
# Description: Both postcodes must be present — the gate is a binary relation between two consecutive stage artifacts
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gateInput.fromPostcode !== null && gateInput.toPostcode !== null
exit 0
