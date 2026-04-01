#!/bin/bash
# Invariant: governorDecision.postcode !== null
# Entity: GovernorDecision
# Description: every governor decision must be content-addressed — it is a provenance checkpoint in the pipeline
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governorDecision.postcode !== null
exit 0
