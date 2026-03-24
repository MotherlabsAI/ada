#!/bin/bash
# Invariant: elicitationSession.sessionId !== null && elicitationSession.sessionId.length > 0
# Entity: ElicitationSession
# Description: Session must have identity — anonymous sessions cannot be referenced by turns or handoff records
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: elicitationSession.sessionId !== null && elicitationSession.sessionId.length > 0
exit 0
