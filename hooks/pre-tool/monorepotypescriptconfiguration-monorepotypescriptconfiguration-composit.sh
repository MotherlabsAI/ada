#!/bin/bash
# Invariant: monoRepoTypeScriptConfiguration.compositeEnabled === true
# Entity: MonorepoTypeScriptConfiguration
# Description: project references require composite mode; without it, TypeScript cannot build packages in dependency order and cross-package type errors may be silently skipped
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: monoRepoTypeScriptConfiguration.compositeEnabled === true
exit 0
