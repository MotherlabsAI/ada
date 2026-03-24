#!/bin/bash
# Invariant: blocker.linkedGapId !== null && blocker.linkedGapId.length > 0
# Entity: ENTBlocker
# Description: blockers must trace to a gap or they are causally ungrounded records that cannot be cleared by resolving the gap
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blocker.linkedGapId !== null && blocker.linkedGapId.length > 0
exit 0
