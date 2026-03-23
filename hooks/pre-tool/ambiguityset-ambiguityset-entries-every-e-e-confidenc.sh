#!/bin/bash
# Invariant: ambiguitySet.entries.every(e => e.confidence !== null)
# Entity: AmbiguitySet
# Description: every entry must carry a confidence value
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ambiguitySet.entries.every(e => e.confidence !== null)
exit 0
