#!/bin/bash
# Invariant: pinnedPrompt.stageTarget !== null
# Entity: PinnedPrompt
# Description: prompt must declare which stage it targets
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pinnedPrompt.stageTarget !== null
exit 0
