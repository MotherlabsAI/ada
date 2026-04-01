#!/bin/bash
# Invariant: driftEvent.id !== null && driftEvent.id.length > 0
# Entity: DriftEvent
# Description: every drift event must be uniquely identified — anonymous drift events cannot be referenced in session summaries
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: driftEvent.id !== null && driftEvent.id.length > 0
exit 0
