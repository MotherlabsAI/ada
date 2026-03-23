#!/bin/bash
# Invariant: canonicalReferent.namespace !== null
# Entity: CanonicalReferent
# Description: namespace must be present to scope the referent
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: canonicalReferent.namespace !== null
exit 0
