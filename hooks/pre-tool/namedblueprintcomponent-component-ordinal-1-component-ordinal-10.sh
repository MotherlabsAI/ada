#!/bin/bash
# Invariant: component.ordinal >= 1 && component.ordinal <= 10
# Entity: NamedBlueprintComponent
# Description: ordinals must fall within the 10-component spec range; ordinal 0 or ordinal 11+ would reference non-existent components
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: component.ordinal >= 1 && component.ordinal <= 10
exit 0
