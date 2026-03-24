#!/bin/bash
# Invariant: ["blocking","major","minor"].includes(challenge.severity)
# Entity: Challenge
# Description: Severity must be a known class — the Governor uses it to determine gate eligibility
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ["blocking","major","minor"].includes(challenge.severity)
exit 0
