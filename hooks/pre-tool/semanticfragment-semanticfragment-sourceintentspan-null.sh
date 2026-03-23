#!/bin/bash
# Invariant: semanticFragment.sourceIntentSpan !== null
# Entity: SemanticFragment
# Description: fragment must trace back to a span in the original intent
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: semanticFragment.sourceIntentSpan !== null
exit 0
