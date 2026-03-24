#!/bin/bash
# Invariant: workflowStep.hoareTriple !== null
# Entity: WorkflowStep
# Description: every workflow step must have a Hoare triple defining its contract
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: workflowStep.hoareTriple !== null
exit 0
