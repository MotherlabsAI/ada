#!/bin/bash
# Invariant: pkg.srcRoot !== null
# Entity: WorkspacePackage
# Description: a package without a source root has no compilation surface
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pkg.srcRoot !== null
exit 0
