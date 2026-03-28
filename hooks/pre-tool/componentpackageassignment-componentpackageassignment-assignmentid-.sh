#!/bin/bash
# Invariant: componentPackageAssignment.assignmentId !== null && componentPackageAssignment.assignmentId.length > 0
# Entity: ComponentPackageAssignment
# Description: without a stable assignmentId the mapping aggregate cannot reference or update this assignment
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: componentPackageAssignment.assignmentId !== null && componentPackageAssignment.assignmentId.length > 0
exit 0
