#!/bin/bash
# Invariant: hookScript.path !== null && hookScript.path.startsWith('.claude/hooks/')
# Entity: HookScript
# Description: hook scripts must reside under .claude/hooks/ to be recognized by Claude Code
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: hookScript.path !== null && hookScript.path.startsWith('.claude/hooks/')
exit 0
