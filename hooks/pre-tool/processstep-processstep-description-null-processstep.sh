#!/bin/bash
# Invariant: processStep.description !== null && processStep.description.length > 0
# Entity: ProcessStep
# Description: step must have a description
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: processStep.description !== null && processStep.description.length > 0
exit 0
