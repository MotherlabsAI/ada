#!/bin/bash
# Invariant: disambiguationPass.appliedToStageRunId !== null
# Entity: DisambiguationPass
# Description: pass must be traceable to a specific INT stage run
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: disambiguationPass.appliedToStageRunId !== null
exit 0
