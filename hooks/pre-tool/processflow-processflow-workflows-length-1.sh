#!/bin/bash
# Invariant: processFlow.workflows.length >= 1
# Entity: ProcessFlow
# Description: a process model with no workflows cannot describe behavior — at least one workflow must be modeled
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: processFlow.workflows.length >= 1
exit 0
