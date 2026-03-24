#!/bin/bash
# Invariant: ["stated","derived","implied","unstated"].includes(intentGoal.type)
# Entity: IntentGoal
# Description: Type must be a known classification — without this, the audit stage cannot assess intent coverage fidelity
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ["stated","derived","implied","unstated"].includes(intentGoal.type)
exit 0
