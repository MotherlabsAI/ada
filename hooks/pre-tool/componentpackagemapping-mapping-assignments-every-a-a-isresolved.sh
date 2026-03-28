#!/bin/bash
# Invariant: mapping.assignments.every(a => a.isResolved === true)
# Entity: ComponentPackageMapping
# Description: every individual assignment must be resolved before the mapping is considered total
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: mapping.assignments.every(a => a.isResolved === true)
exit 0
