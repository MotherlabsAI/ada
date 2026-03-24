#!/bin/bash
# Invariant: processFlow.workflows.every(w => w.steps.length >= 1)
# Entity: ProcessFlow
# Description: Every workflow must have at least one step — a stepless workflow is an empty behavioral contract
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: processFlow.workflows.every(w => w.steps.length >= 1)
exit 0
