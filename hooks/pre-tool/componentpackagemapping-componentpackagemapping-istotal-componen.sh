#!/bin/bash
# Invariant: componentPackageMapping.isTotal === (componentPackageMapping.assignments.every(a => a.isResolved))
# Entity: ComponentPackageMapping
# Description: isTotal is only true when ALL assignments are resolved; partial resolution must not present as total
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: componentPackageMapping.isTotal === (componentPackageMapping.assignments.every(a => a.isResolved))
exit 0
