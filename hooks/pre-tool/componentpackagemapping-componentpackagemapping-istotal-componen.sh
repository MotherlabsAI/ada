#!/bin/bash
# Invariant: componentPackageMapping.isTotal === (componentPackageMapping.assignments.every(a => a.isResolved))
# Entity: ComponentPackageMapping
# Description: isTotal must be true only when all assignments are resolved — partial mapping cannot be marked total
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: componentPackageMapping.isTotal === (componentPackageMapping.assignments.every(a => a.isResolved))
exit 0
