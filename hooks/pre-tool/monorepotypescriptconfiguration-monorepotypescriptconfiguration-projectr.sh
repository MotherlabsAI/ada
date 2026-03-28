#!/bin/bash
# Invariant: monoRepoTypeScriptConfiguration.projectReferences.every(ref => ref.path !== null && ref.path.length > 0)
# Entity: MonorepoTypeScriptConfiguration
# Description: every project reference must point to a real path; null or empty paths cause TypeScript to silently skip the referenced package during compilation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: monoRepoTypeScriptConfiguration.projectReferences.every(ref => ref.path !== null && ref.path.length > 0)
exit 0
