#!/bin/bash
# Invariant: outputMessage.stream === 'stdout'
# Entity: OutputMessage
# Description: hello-world output must target stdout
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: outputMessage.stream === 'stdout'
exit 0
