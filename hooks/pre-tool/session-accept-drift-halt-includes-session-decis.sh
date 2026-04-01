#!/bin/bash
# Invariant: ['ACCEPT','DRIFT','HALT'].includes(session.decision)
# Entity: Session
# Description: a session must end with one of three canonical decisions — no other terminal states exist
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ['ACCEPT','DRIFT','HALT'].includes(session.decision)
exit 0
