#!/bin/bash
# Invariant: session.decision === 'HALT' ? /* triggers process.exit(1) */true : true
# Entity: Session
# Description: HALT decision is terminal and must trigger process.exit(1) — no further execution is permitted after HALT
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: session.decision === 'HALT' ? /* triggers process.exit(1) */true : true
exit 0
