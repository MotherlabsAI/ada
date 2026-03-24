#!/bin/bash
# Invariant: disambiguationPass.ordinal >= 1
# Entity: DisambiguationPass
# Description: Ordinal must be at least 1 — passes are 1-indexed sequence numbers
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: disambiguationPass.ordinal >= 1
exit 0
