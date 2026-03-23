#!/bin/bash
# Invariant: tsConfig.path !== null && tsConfig.path.endsWith('.json')
# Entity: TsConfig
# Description: tsconfig must be a JSON file
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: tsConfig.path !== null && tsConfig.path.endsWith('.json')
exit 0
