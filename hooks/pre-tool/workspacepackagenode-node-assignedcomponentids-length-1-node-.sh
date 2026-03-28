#!/bin/bash
# Invariant: node.assignedComponentIds.length >= 1 && node.assignedComponentIds.length <= 2
# Entity: WorkspacePackageNode
# Description: each package must have at least one component and at most two (collapse case); zero means dead package, three or more violates the 10→8 mapping arithmetic
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: node.assignedComponentIds.length >= 1 && node.assignedComponentIds.length <= 2
exit 0
