#!/bin/bash
# Invariant: blocker.isCleared === false ? blocker.clearedAt === null : true
# Entity: ENTBlocker
# Description: uncleared blockers must not have a clearance timestamp; a timestamp without isCleared=true is inconsistent state
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blocker.isCleared === false ? blocker.clearedAt === null : true
exit 0
