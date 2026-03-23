#!/bin/bash
# Invariant: policyViolation.description !== null && policyViolation.description.trim().length > 0
# Entity: PolicyViolation
# Description: violation description must be non-empty
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: policyViolation.description !== null && policyViolation.description.trim().length > 0
exit 0
