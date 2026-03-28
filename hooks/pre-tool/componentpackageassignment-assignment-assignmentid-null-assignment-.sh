#!/bin/bash
# Invariant: assignment.assignmentId !== null && assignment.assignmentId.length > 0
# Entity: ComponentPackageAssignment
# Description: assignment must be uniquely identifiable for gap detection and provenance linking
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: assignment.assignmentId !== null && assignment.assignmentId.length > 0
exit 0
