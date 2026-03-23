#!/bin/bash
# Invariant: targetAchieved.threshold.value === 0.30
# Entity: TargetAchieved
# Description: target is always evaluated against the hard threshold, not a caller-supplied value
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: targetAchieved.threshold.value === 0.30
exit 0
