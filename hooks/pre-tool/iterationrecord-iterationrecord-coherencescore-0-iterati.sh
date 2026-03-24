#!/bin/bash
# Invariant: iterationRecord.coherenceScore >= 0 && iterationRecord.coherenceScore <= 1
# Entity: IterationRecord
# Description: Coherence score must be in [0,1]
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: iterationRecord.coherenceScore >= 0 && iterationRecord.coherenceScore <= 1
exit 0
