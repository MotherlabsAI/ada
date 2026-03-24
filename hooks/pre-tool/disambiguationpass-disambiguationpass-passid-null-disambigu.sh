#!/bin/bash
# Invariant: disambiguationPass.passId !== null && disambiguationPass.passId.length > 0
# Entity: DisambiguationPass
# Description: Pass must have identity — anonymous passes cannot be referenced in disambiguation history
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: disambiguationPass.passId !== null && disambiguationPass.passId.length > 0
exit 0
