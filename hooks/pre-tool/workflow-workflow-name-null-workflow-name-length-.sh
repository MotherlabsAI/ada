#!/bin/bash
# Invariant: workflow.name !== null && workflow.name.length > 0
# Entity: Workflow
# Description: workflow must have a name
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: workflow.name !== null && workflow.name.length > 0
exit 0
