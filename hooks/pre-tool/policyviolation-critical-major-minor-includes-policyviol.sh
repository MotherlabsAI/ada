#!/bin/bash
# Invariant: ["critical","major","minor"].includes(policyViolation.severity)
# Entity: PolicyViolation
# Description: Severity must be classified — the Governor uses it to determine if the violation is gate-blocking
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ["critical","major","minor"].includes(policyViolation.severity)
exit 0
