#!/bin/bash
# Invariant: !(elicitationSession.status === 'handed-off') || elicitationSession.terminatedAt !== null
# Entity: ElicitationSession
# Description: A handed-off session must have a recorded termination timestamp — without this, session lifecycle is not auditable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: !(elicitationSession.status === 'handed-off') || elicitationSession.terminatedAt !== null
exit 0
