#!/bin/bash
# Invariant: adaMonorepo.name !== null && adaMonorepo.name.length > 0
# Entity: AdaMonorepo
# Description: monorepo must have a non-empty name
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: adaMonorepo.name !== null && adaMonorepo.name.length > 0
exit 0
