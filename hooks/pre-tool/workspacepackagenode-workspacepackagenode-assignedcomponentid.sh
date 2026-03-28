#!/bin/bash
# Invariant: workspacePackageNode.assignedComponentIds !== null
# Entity: WorkspacePackageNode
# Description: the assigned component list must exist (may be empty) so that per-package component coverage can be computed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: workspacePackageNode.assignedComponentIds !== null
exit 0
