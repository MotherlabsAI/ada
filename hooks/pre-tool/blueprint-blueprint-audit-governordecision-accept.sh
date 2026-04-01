#!/bin/bash
# Invariant: blueprint.audit.governorDecision === 'ACCEPT'
# Entity: Blueprint
# Description: a blueprint is only produced on GOV ACCEPT — a REJECT or ITERATE output is not a valid blueprint
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.audit.governorDecision === 'ACCEPT'
exit 0
