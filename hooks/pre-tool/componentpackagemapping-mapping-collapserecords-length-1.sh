#!/bin/bash
# Invariant: mapping.collapseRecords.length === 1
# Entity: ComponentPackageMapping
# Description: exactly one collapse record must exist to account for the two components that share a single package target
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: mapping.collapseRecords.length === 1
exit 0
