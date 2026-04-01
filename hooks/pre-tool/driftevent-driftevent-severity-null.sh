#!/bin/bash
# Invariant: driftEvent.severity !== null
# Entity: DriftEvent
# Description: severity must be assigned to enable policy triage of drift events
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: driftEvent.severity !== null
exit 0
