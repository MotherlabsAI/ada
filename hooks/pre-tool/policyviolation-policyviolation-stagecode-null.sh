#!/bin/bash
# Invariant: policyViolation.stageCode !== null
# Entity: PolicyViolation
# Description: Stage must be identified — violations without stage attribution cannot drive targeted remediation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: policyViolation.stageCode !== null
exit 0
