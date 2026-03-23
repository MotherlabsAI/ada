#!/bin/bash
# Invariant: cleanBuildState.initiatedAt > 0
# Entity: CleanBuildState
# Description: clean must record a valid initiation timestamp
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: cleanBuildState.initiatedAt > 0
exit 0
