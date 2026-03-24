#!/bin/bash
# Invariant: disambiguationPass.targetEntityCount > 0
# Entity: DisambiguationPass
# Description: Pass must target at least one entity — a pass with no targets has no disambiguation purpose
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: disambiguationPass.targetEntityCount > 0
exit 0
