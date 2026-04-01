#!/bin/bash
# Invariant: componentPackageAssignment.targetPackage !== null
# Entity: ComponentPackageAssignment
# Description: every assignment must name a target package; a null package means the component is unrouted and the mapping is not total
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: componentPackageAssignment.targetPackage !== null
exit 0
