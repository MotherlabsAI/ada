#!/bin/bash
# Invariant: policyViolation.affectedElementId !== null
# Entity: PolicyViolation
# Description: violation must reference the affected blueprint element
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: policyViolation.affectedElementId !== null
exit 0
