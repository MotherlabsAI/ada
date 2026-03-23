#!/bin/bash
# Invariant: ambiguitySet.sourceRunId !== null && ambiguitySet.sourceRunId.length > 0
# Entity: AmbiguitySet
# Description: ambiguity set must be traceable to a source run
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ambiguitySet.sourceRunId !== null && ambiguitySet.sourceRunId.length > 0
exit 0
