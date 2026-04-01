#!/bin/bash
# Invariant: elicitationSession.rawIntent !== null && elicitationSession.rawIntent.length > 0
# Entity: ElicitationSession
# Description: the original raw intent must be preserved — it is the provenance anchor for the entire elicitation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: elicitationSession.rawIntent !== null && elicitationSession.rawIntent.length > 0
exit 0
