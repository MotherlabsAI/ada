#!/bin/bash
# Invariant: policyViolation.severity !== null
# Entity: PolicyViolation
# Description: Severity must be classified — unseveritized violations cannot be prioritized by the governor
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: policyViolation.severity !== null
exit 0
