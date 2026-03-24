#!/bin/bash
# Invariant: disambiguationPass.targetEntityCount === 26
# Entity: DisambiguationPass
# Description: Target entity count must be exactly 26 — this is a fixed pipeline constant
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: disambiguationPass.targetEntityCount === 26
exit 0
