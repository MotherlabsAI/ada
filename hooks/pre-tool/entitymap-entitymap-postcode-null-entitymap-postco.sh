#!/bin/bash
# Invariant: entityMap.postcode !== null && entityMap.postcode.length > 0
# Entity: EntityMap
# Description: the EntityMap must have a provenance address so the ENT gate can reference it as evidence of entity extraction
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMap.postcode !== null && entityMap.postcode.length > 0
exit 0
