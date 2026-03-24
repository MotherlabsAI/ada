#!/bin/bash
# Invariant: ["entity","process"].includes(resolvedConflict.authoritative)
# Entity: ResolvedConflict
# Description: Authoritative source must be classified — without it the resolution cannot be enforced downstream
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ["entity","process"].includes(resolvedConflict.authoritative)
exit 0
