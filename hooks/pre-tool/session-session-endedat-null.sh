#!/bin/bash
# Invariant: session.endedAt !== null
# Entity: Session
# Description: a session without an endedAt timestamp has not terminated and must not carry a decision
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: session.endedAt !== null
exit 0
