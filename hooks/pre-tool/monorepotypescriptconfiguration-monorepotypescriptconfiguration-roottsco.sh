#!/bin/bash
# Invariant: monoRepoTypeScriptConfiguration.rootTsConfigPath !== null && monoRepoTypeScriptConfiguration.rootTsConfigPath.length > 0
# Entity: MonorepoTypeScriptConfiguration
# Description: a monorepo must have a root tsconfig; without it, cross-package type checking is undefined and G7 cannot be evaluated
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: monoRepoTypeScriptConfiguration.rootTsConfigPath !== null && monoRepoTypeScriptConfiguration.rootTsConfigPath.length > 0
exit 0
