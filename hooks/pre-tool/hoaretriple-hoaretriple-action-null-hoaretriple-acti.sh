#!/bin/bash
# Invariant: hoareTriple.action !== null && hoareTriple.action.length > 0
# Entity: HoareTriple
# Description: Action must be named — the triple without action has no semantic transformation to constrain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: hoareTriple.action !== null && hoareTriple.action.length > 0
exit 0
