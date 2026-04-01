#!/bin/bash
# Invariant: ['critical','major','minor'].includes(driftEvent.severity)
# Entity: DriftEvent
# Description: severity must be one of three canonical levels
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ['critical','major','minor'].includes(driftEvent.severity)
exit 0
