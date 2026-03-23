#!/bin/bash
# Invariant: canonicalReferent.label !== null
# Entity: CanonicalReferent
# Description: label must be present to identify the referent
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: canonicalReferent.label !== null
exit 0
