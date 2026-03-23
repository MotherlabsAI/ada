#!/bin/bash
# Invariant: canonicalReferent.id !== null && canonicalReferent.id.length > 0
# Entity: CanonicalReferent
# Description: canonical referent must have a unique identifier
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: canonicalReferent.id !== null && canonicalReferent.id.length > 0
exit 0
