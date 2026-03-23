#!/bin/bash
# Invariant: governorDecision.postcode.stage === 'GOV'
# Entity: GovernorDecision
# Description: governor decision postcode must carry the GOV stage tag
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governorDecision.postcode.stage === 'GOV'
exit 0
