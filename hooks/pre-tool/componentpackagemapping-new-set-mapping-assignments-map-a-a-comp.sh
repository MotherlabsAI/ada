#!/bin/bash
# Invariant: new Set(mapping.assignments.map(a => a.componentOrdinal)).size === mapping.assignments.length
# Entity: ComponentPackageMapping
# Description: each component ordinal must appear exactly once; duplicate ordinals mean one component is assigned twice and another not at all
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: new Set(mapping.assignments.map(a => a.componentOrdinal)).size === mapping.assignments.length
exit 0
