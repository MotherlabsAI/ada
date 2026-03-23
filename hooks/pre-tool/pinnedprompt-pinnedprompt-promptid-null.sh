#!/bin/bash
# Invariant: pinnedPrompt.promptId !== null
# Entity: PinnedPrompt
# Description: prompt must be identified
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pinnedPrompt.promptId !== null
exit 0
