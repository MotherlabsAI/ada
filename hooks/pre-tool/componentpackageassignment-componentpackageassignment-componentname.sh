#!/bin/bash
# Invariant: componentPackageAssignment.componentName !== null && componentPackageAssignment.componentName.length > 0
# Entity: ComponentPackageAssignment
# Description: componentName must be non-empty — anonymous assignments cannot be referenced in contracts
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: componentPackageAssignment.componentName !== null && componentPackageAssignment.componentName.length > 0
exit 0
