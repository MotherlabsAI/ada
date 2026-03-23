#!/bin/bash
# Invariant: policyViolation.violationId !== null
# Entity: PolicyViolation
# Description: violation must be identified
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: policyViolation.violationId !== null
exit 0
