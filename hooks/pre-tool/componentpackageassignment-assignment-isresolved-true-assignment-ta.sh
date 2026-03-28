#!/bin/bash
# Invariant: assignment.isResolved === true ? assignment.targetPackage !== null : true
# Entity: ComponentPackageAssignment
# Description: a resolved assignment must have a non-null target package
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: assignment.isResolved === true ? assignment.targetPackage !== null : true
exit 0
