#!/bin/bash
# Invariant: workflowStep.name !== null && workflowStep.name.length > 0
# Entity: WorkflowStep
# Description: workflow step must have a name
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: workflowStep.name !== null && workflowStep.name.length > 0
exit 0
