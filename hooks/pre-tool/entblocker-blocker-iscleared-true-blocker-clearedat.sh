#!/bin/bash
# Invariant: blocker.isCleared === true ? blocker.clearedAt !== null : true
# Entity: ENTBlocker
# Description: cleared blockers must record when they were cleared so gate evaluation can verify the clearance is not retroactive
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blocker.isCleared === true ? blocker.clearedAt !== null : true
exit 0
