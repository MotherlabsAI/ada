#!/bin/bash
# Invariant: rootTsConfig.composite === true
# Entity: RootTsConfig
# Description: root tsconfig must enable composite for project-wide build orchestration
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: rootTsConfig.composite === true
exit 0
