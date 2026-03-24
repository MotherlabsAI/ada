#!/bin/bash
# Invariant: workflow.steps.length > 0
# Entity: Workflow
# Description: workflow must contain at least one step
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: workflow.steps.length > 0
exit 0
