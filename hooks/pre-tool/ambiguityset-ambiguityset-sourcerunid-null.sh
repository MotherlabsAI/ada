#!/bin/bash
# Invariant: ambiguitySet.sourceRunId !== null
# Entity: AmbiguitySet
# Description: ambiguity set must reference the run it was hydrated from
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ambiguitySet.sourceRunId !== null
exit 0
