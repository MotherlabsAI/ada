#!/bin/bash
# Invariant: /* session is complete only when all blocking unknowns are resolved */elicitationSession.status === 'complete' ? elicitationSession.draftIntentGraph.goals.length >= 1 : true
# Entity: ElicitationSession
# Description: completion requires at least one resolved goal — an empty goal list means the intent was never clarified
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: /* session is complete only when all blocking unknowns are resolved */elicitationSession.status === 'complete' ? elicitationSession.draftIntentGraph.goals.length >= 1 : true
exit 0
