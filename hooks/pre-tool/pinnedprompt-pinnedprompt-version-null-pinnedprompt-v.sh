#!/bin/bash
# Invariant: pinnedPrompt.version !== null && pinnedPrompt.version.length > 0
# Entity: PinnedPrompt
# Description: prompt version must be non-empty
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pinnedPrompt.version !== null && pinnedPrompt.version.length > 0
exit 0
