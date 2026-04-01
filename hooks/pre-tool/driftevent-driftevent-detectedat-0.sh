#!/bin/bash
# Invariant: driftEvent.detectedAt > 0
# Entity: DriftEvent
# Description: detectedAt must be a positive epoch timestamp
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: driftEvent.detectedAt > 0
exit 0
