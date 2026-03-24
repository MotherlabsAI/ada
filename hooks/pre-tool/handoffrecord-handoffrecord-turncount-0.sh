#!/bin/bash
# Invariant: handoffRecord.turnCount > 0
# Entity: HandoffRecord
# Description: Handoff must record at least one turn — a zero-turn session has not elicited anything
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: handoffRecord.turnCount > 0
exit 0
