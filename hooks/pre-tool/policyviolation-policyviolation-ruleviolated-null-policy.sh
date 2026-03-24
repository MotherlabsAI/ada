#!/bin/bash
# Invariant: policyViolation.ruleViolated !== null && policyViolation.ruleViolated.length > 0
# Entity: PolicyViolation
# Description: Violated rule must be named — anonymous violations cannot be traced to governor policy
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: policyViolation.ruleViolated !== null && policyViolation.ruleViolated.length > 0
exit 0
