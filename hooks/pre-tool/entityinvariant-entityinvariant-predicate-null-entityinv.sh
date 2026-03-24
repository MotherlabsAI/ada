#!/bin/bash
# Invariant: entityInvariant.predicate !== null && entityInvariant.predicate.length > 0
# Entity: EntityInvariant
# Description: Predicate must be non-empty — a description without a machine-checkable predicate cannot be verified by the audit stage
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityInvariant.predicate !== null && entityInvariant.predicate.length > 0
exit 0
