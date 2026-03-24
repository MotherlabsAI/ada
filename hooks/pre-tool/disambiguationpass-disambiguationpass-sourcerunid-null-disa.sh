#!/bin/bash
# Invariant: disambiguationPass.sourceRunId !== null && disambiguationPass.sourceRunId.length > 0
# Entity: DisambiguationPass
# Description: Source run ID must be present — the pass must be attributable to a specific pipeline run
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: disambiguationPass.sourceRunId !== null && disambiguationPass.sourceRunId.length > 0
exit 0
