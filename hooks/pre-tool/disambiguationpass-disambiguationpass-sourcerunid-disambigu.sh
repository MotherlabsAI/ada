#!/bin/bash
# Invariant: disambiguationPass.sourceRunId !== disambiguationPass.producedRunId
# Entity: DisambiguationPass
# Description: a pass cannot produce the same run it references as source
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: disambiguationPass.sourceRunId !== disambiguationPass.producedRunId
exit 0
