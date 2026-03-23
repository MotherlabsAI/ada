#!/bin/bash
# Invariant: disambiguationPass.conflictsResolved >= 0
# Entity: DisambiguationPass
# Description: resolved conflict count is non-negative
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: disambiguationPass.conflictsResolved >= 0
exit 0
