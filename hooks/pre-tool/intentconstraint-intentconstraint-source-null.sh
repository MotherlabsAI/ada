#!/bin/bash
# Invariant: intentConstraint.source !== null
# Entity: IntentConstraint
# Description: Source must be declared — constraints without origin cannot be audited for domain alignment
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intentConstraint.source !== null
exit 0
