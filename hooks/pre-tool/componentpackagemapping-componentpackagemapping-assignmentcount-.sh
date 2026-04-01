#!/bin/bash
# Invariant: componentPackageMapping.assignmentCount === componentPackageMapping.assignments.length
# Entity: ComponentPackageMapping
# Description: assignmentCount must match assignments array length — inconsistency indicates corruption
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: componentPackageMapping.assignmentCount === componentPackageMapping.assignments.length
exit 0
