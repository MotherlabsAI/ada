#!/bin/bash
# Invariant: policyViolation.violatedRuleId !== null
# Entity: PolicyViolation
# Description: violation must reference the rule that was violated
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: policyViolation.violatedRuleId !== null
exit 0
