#!/bin/bash
# Invariant: hookScript.path !== null && hookScript.path.length > 0
# Entity: HookScript
# Description: hooks must have a write path — pathless hooks cannot be persisted to .claude/hooks/
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: hookScript.path !== null && hookScript.path.length > 0
exit 0
