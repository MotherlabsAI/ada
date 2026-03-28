#!/bin/bash
# Invariant: componentPackageMapping.assignments.map(a => a.componentOrdinal).every((o, i, arr) => arr.indexOf(o) === i)
# Entity: ComponentPackageMapping
# Description: each component ordinal must appear at most once; duplicate assignments would double-count components and corrupt the 10-to-8 mapping
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: componentPackageMapping.assignments.map(a => a.componentOrdinal).every((o, i, arr) => arr.indexOf(o) === i)
exit 0
