#!/bin/bash
# Invariant: hookScript.matcher !== null && hookScript.matcher.length > 0
# Entity: HookScript
# Description: matcher must be non-empty to specify which tool calls this hook intercepts
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: hookScript.matcher !== null && hookScript.matcher.length > 0
exit 0
