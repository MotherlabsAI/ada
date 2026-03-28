#!/bin/bash
# Invariant: componentPackageMapping.mappingId !== null && componentPackageMapping.mappingId.length > 0
# Entity: ComponentPackageMapping
# Description: without a mappingId no ComponentPackageAssignment can reference back to its aggregate
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: componentPackageMapping.mappingId !== null && componentPackageMapping.mappingId.length > 0
exit 0
