#!/bin/bash
# Invariant: processFlow.workflows.every(w => w.steps.length >= 1)
# Entity: ProcessFlow
# Description: every workflow must have at least one step — stepless workflows cannot be verified against Hoare triples
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: processFlow.workflows.every(w => w.steps.length >= 1)
exit 0
