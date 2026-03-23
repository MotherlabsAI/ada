#!/bin/bash
# Invariant: processStep.stepId !== null
# Entity: ProcessStep
# Description: step must have an id
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: processStep.stepId !== null
exit 0
