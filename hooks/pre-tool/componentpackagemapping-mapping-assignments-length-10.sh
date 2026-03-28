#!/bin/bash
# Invariant: mapping.assignments.length === 10
# Entity: ComponentPackageMapping
# Description: the assignments array length must equal the declared count
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: mapping.assignments.length === 10
exit 0
