#!/bin/bash
# Invariant: handoffRecord.handoffId !== null && handoffRecord.handoffId.length > 0
# Entity: HandoffRecord
# Description: handoffId must be non-null to identify the boundary event between elicitation and compilation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: handoffRecord.handoffId !== null && handoffRecord.handoffId.length > 0
exit 0
