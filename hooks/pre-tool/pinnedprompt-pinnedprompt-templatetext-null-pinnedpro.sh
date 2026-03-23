#!/bin/bash
# Invariant: pinnedPrompt.templateText !== null && pinnedPrompt.templateText.length > 0
# Entity: PinnedPrompt
# Description: prompt must have template text
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pinnedPrompt.templateText !== null && pinnedPrompt.templateText.length > 0
exit 0
