#!/bin/bash
# Invariant: governorDecision.postcode !== null
# Entity: GovernorDecision
# Description: GovernorDecision must carry a postcode — it is a typed artifact in the compilation run
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governorDecision.postcode !== null
exit 0
