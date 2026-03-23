#!/bin/bash
# Invariant: rootTsConfig.path !== null && rootTsConfig.path.endsWith('.json')
# Entity: RootTsConfig
# Description: root tsconfig must be a JSON file
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: rootTsConfig.path !== null && rootTsConfig.path.endsWith('.json')
exit 0
