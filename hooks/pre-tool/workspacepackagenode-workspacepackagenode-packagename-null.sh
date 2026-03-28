#!/bin/bash
# Invariant: workspacePackageNode.packageName !== null
# Entity: WorkspacePackageNode
# Description: without a packageName the node cannot be referenced by any ComponentPackageAssignment
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: workspacePackageNode.packageName !== null
exit 0
