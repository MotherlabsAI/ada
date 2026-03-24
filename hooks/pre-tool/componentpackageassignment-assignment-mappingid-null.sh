#!/bin/bash
# Invariant: assignment.mappingId !== null
# Entity: ComponentPackageAssignment
# Description: every assignment must belong to exactly one ComponentPackageMapping — orphaned assignments break G1 total-mapping accounting
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: assignment.mappingId !== null
exit 0
