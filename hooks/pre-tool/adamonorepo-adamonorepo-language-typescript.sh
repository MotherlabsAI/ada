#!/bin/bash
# Invariant: adaMonorepo.language === 'TypeScript'
# Entity: AdaMonorepo
# Description: monorepo is a TypeScript workspace
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: adaMonorepo.language === 'TypeScript'
exit 0
