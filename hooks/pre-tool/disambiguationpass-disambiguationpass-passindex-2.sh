#!/bin/bash
# Invariant: disambiguationPass.passIndex === 2
# Entity: DisambiguationPass
# Description: disambiguation pass is the second pass, not the first
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: disambiguationPass.passIndex === 2
exit 0
