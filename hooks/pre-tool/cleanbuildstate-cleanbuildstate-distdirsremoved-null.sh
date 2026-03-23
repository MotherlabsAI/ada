#!/bin/bash
# Invariant: cleanBuildState.distDirsRemoved !== null
# Entity: CleanBuildState
# Description: clean state must track which dist directories were removed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: cleanBuildState.distDirsRemoved !== null
exit 0
