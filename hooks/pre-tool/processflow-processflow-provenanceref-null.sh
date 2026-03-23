#!/bin/bash
# Invariant: processFlow.provenanceRef !== null
# Entity: ProcessFlow
# Description: process flow must carry provenance
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: processFlow.provenanceRef !== null
exit 0
