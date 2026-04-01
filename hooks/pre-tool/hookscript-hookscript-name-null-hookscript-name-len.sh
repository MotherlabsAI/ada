#!/bin/bash
# Invariant: hookScript.name !== null && hookScript.name.length > 0
# Entity: HookScript
# Description: hooks must be named for registration in .claude/settings.json — anonymous hooks cannot be registered
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: hookScript.name !== null && hookScript.name.length > 0
exit 0
