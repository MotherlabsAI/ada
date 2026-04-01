#!/bin/bash
# Invariant: /* Blueprint is only produced on GOV ACCEPT */ blueprint.audit.governorDecision === 'ACCEPT'
# Entity: Blueprint
# Description: Blueprint is only produced when governor emits ACCEPT — any other decision must not produce a Blueprint
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: /* Blueprint is only produced on GOV ACCEPT */ blueprint.audit.governorDecision === 'ACCEPT'
exit 0
