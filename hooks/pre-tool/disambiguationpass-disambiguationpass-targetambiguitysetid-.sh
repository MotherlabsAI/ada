#!/bin/bash
# Invariant: disambiguationPass.targetAmbiguitySetId !== null && disambiguationPass.targetAmbiguitySetId.length > 0
# Entity: DisambiguationPass
# Description: pass must target an explicit ambiguity set
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: disambiguationPass.targetAmbiguitySetId !== null && disambiguationPass.targetAmbiguitySetId.length > 0
exit 0
