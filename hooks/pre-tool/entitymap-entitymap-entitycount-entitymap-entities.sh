#!/bin/bash
# Invariant: entityMap.entityCount === entityMap.entities.length
# Entity: EntityMap
# Description: the declared count must match the actual array length or the ENT gate will evaluate on wrong numbers
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMap.entityCount === entityMap.entities.length
exit 0
