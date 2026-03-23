#!/bin/bash
# Invariant: processStep.provenanceRef !== null
# Entity: ProcessStep
# Description: every step must be traceable to intent
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: processStep.provenanceRef !== null
exit 0
