#!/bin/bash
# Invariant: hookScript.type === 'pre-tool' || hookScript.type === 'post-tool'
# Entity: HookScript
# Description: hooks may only be pre-tool or post-tool — no other hook positions are defined in the governed execution model
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: hookScript.type === 'pre-tool' || hookScript.type === 'post-tool'
exit 0
