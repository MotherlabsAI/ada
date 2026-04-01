#!/bin/bash
# Invariant: ['pre-tool','post-tool'].includes(hookScript.type)
# Entity: HookScript
# Description: hook type must be one of two canonical values — other hook types are not supported by Claude Code
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ['pre-tool','post-tool'].includes(hookScript.type)
exit 0
