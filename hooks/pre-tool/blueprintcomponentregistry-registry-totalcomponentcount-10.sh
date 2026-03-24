#!/bin/bash
# Invariant: registry.totalComponentCount === 10
# Entity: BlueprintComponentRegistry
# Description: exactly 10 BlueprintComponents are declared in spec; fewer means incomplete registration, more means contamination from outside the spec
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: registry.totalComponentCount === 10
exit 0
