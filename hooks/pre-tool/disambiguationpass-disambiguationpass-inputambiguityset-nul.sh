#!/bin/bash
# Invariant: disambiguationPass.inputAmbiguitySet !== null
# Entity: DisambiguationPass
# Description: pass must operate on a non-null ambiguity set
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: disambiguationPass.inputAmbiguitySet !== null
exit 0
