#!/bin/bash
# Invariant: mapping.assignmentCount === 10
# Entity: ComponentPackageMapping
# Description: all 10 components must have an assignment entry — a partial mapping leaves components unmapped and breaks entity extraction
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: mapping.assignmentCount === 10
exit 0
