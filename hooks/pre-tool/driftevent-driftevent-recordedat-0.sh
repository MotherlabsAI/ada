#!/bin/bash
# Invariant: driftEvent.recordedAt > 0
# Entity: DriftEvent
# Description: drift events must have a positive timestamp — zero timestamps indicate an unrecorded event
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: driftEvent.recordedAt > 0
exit 0
