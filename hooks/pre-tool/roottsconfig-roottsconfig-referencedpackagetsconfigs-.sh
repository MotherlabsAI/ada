#!/bin/bash
# Invariant: rootTsConfig.referencedPackageTsConfigs.length > 0
# Entity: RootTsConfig
# Description: root tsconfig must reference at least one package tsconfig
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: rootTsConfig.referencedPackageTsConfigs.length > 0
exit 0
