#!/bin/bash
# Invariant: workspacePackageNode.assignedComponentIds.length >= 1
# Entity: WorkspacePackageNode
# Description: G3 maps 10 components to 8 packages, meaning some packages receive multiple components; a package with zero assigned components is unused and should not exist in the mapping
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: workspacePackageNode.assignedComponentIds.length >= 1
exit 0
