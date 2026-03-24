#!/bin/bash
# Invariant: registration.registeredAt > 0
# Entity: ENTEntityRegistration
# Description: registration timestamp must be a positive epoch value; zero indicates the record was never actually committed
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: registration.registeredAt > 0
exit 0
