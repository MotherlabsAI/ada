#!/bin/bash
# Invariant: component.ordinal === 3 ? component.assignedPackage === null || component.assignedPackage !== null : true
# Entity: NamedBlueprintComponent
# Description: ordinal 3 is structurally valid with or without assignment; the C3AssignmentGap entity captures the unassigned case as a separate record
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: component.ordinal === 3 ? component.assignedPackage === null || component.assignedPackage !== null : true
exit 0
