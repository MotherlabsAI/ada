#!/bin/bash
# Invariant: node.assignedComponentIds.length >= 1
# Entity: WorkspacePackageNode
# Description: a package node that participates in the mapping must have at least one component; zero-assigned packages are not part of the 8-target mapping
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: node.assignedComponentIds.length >= 1
exit 0
