#!/bin/bash
# Invariant: adaSystem.intellectualIdentity !== null
# Entity: AdaSystem
# Description: Ada's category-of-system articulation must exist — without it G6 cannot be satisfied
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: adaSystem.intellectualIdentity !== null
exit 0
