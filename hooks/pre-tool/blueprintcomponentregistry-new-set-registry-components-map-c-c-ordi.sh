#!/bin/bash
# Invariant: new Set(registry.components.map(c => c.ordinal)).size === registry.components.length
# Entity: BlueprintComponentRegistry
# Description: every component must have a unique ordinal within the registry; duplicate ordinals produce ambiguous mappings
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: new Set(registry.components.map(c => c.ordinal)).size === registry.components.length
exit 0
