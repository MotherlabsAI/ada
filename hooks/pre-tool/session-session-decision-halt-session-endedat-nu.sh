#!/bin/bash
# Invariant: session.decision === 'HALT' ? session.endedAt !== null : true
# Entity: Session
# Description: a HALT decision must record when it occurred — HALT triggers process.exit(1) and must be auditable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: session.decision === 'HALT' ? session.endedAt !== null : true
exit 0
