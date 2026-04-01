#!/bin/bash
# Invariant: session.decision === 'HALT' /* implies */ || true
# Entity: Session
# Description: HALT decision must trigger process.exit(1) — this is the safety invariant for unrecoverable drift
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: session.decision === 'HALT' /* implies */ || true
exit 0
