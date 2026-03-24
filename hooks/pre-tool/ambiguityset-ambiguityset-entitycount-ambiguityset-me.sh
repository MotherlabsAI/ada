#!/bin/bash
# Invariant: ambiguitySet.entityCount === ambiguitySet.memberEntityIds.length
# Entity: AmbiguitySet
# Description: Declared entity count must match actual member count — a mismatch indicates corrupt set construction
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ambiguitySet.entityCount === ambiguitySet.memberEntityIds.length
exit 0
