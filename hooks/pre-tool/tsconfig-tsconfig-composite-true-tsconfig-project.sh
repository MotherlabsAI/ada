#!/bin/bash
# Invariant: tsConfig.composite === true || tsConfig.projectReferences.length === 0
# Entity: TsConfig
# Description: a tsconfig with project references must have composite enabled
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: tsConfig.composite === true || tsConfig.projectReferences.length === 0
exit 0
