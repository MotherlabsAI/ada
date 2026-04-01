#!/bin/bash
# Invariant: driftEvent.original !== driftEvent.actual
# Entity: DriftEvent
# Description: a drift event where original equals actual is not a drift — it is a no-op and should not be recorded
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: driftEvent.original !== driftEvent.actual
exit 0
