#!/bin/bash
# Invariant: monoRepoTypeScriptConfiguration.packageTsConfigPaths.length === 8
# Entity: MonorepoTypeScriptConfiguration
# Description: G3 establishes 8 workspace packages; each must have its own tsconfig entry for the project reference graph to be complete
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: monoRepoTypeScriptConfiguration.packageTsConfigPaths.length === 8
exit 0
