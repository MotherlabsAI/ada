#!/bin/bash
# Invariant: disambiguationPass.ordinal >= 0
# Entity: DisambiguationPass
# Description: Pass ordinal must be non-negative — negative ordinals corrupt sequential pass ordering
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: disambiguationPass.ordinal >= 0
exit 0
