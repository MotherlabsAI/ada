#!/bin/bash
# Invariant: handoffRecord.handoffId !== null && handoffRecord.handoffId.length > 0
# Entity: HandoffRecord
# Description: Handoff must have identity — anonymous handoffs cannot be referenced by the orchestrator
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: handoffRecord.handoffId !== null && handoffRecord.handoffId.length > 0
exit 0
