#!/bin/bash
# Invariant: disambiguationPass.passOrdinal >= 2
# Entity: DisambiguationPass
# Description: int-rerun always performs at least the second pass; ordinal 1 belongs to the original INT stage
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: disambiguationPass.passOrdinal >= 2
exit 0
