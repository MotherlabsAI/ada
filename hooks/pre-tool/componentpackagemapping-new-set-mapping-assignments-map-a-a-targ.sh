#!/bin/bash
# Invariant: new Set(mapping.assignments.map(a => a.targetPackage)).size === 8
# Entity: ComponentPackageMapping
# Description: exactly 8 distinct target packages must appear — more or fewer violates the 10→8 mapping invariant
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: new Set(mapping.assignments.map(a => a.targetPackage)).size === 8
exit 0
