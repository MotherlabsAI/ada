#!/bin/bash
# Invariant: pkg.assignedComponentIds !== null
# Entity: WorkspacePackageNode
# Description: assigned component IDs array must exist (may be empty for unassigned packages) — null breaks the reverse lookup from package to components
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pkg.assignedComponentIds !== null
exit 0
