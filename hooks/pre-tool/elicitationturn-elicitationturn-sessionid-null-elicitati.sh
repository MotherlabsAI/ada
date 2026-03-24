#!/bin/bash
# Invariant: elicitationTurn.sessionId !== null && elicitationTurn.sessionId.length > 0
# Entity: ElicitationTurn
# Description: Turn must belong to a session — orphan turns break session-level gap tracking
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: elicitationTurn.sessionId !== null && elicitationTurn.sessionId.length > 0
exit 0
