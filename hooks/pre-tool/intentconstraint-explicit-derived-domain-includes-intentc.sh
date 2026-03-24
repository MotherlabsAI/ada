#!/bin/bash
# Invariant: ["explicit","derived","domain"].includes(intentConstraint.source)
# Entity: IntentConstraint
# Description: Source must be classified — it determines the weight the Governor assigns to constraint violations
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ["explicit","derived","domain"].includes(intentConstraint.source)
exit 0
