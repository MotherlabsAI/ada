#!/bin/bash
# Invariant: outputMessage.text === 'Hello, World!'
# Entity: OutputMessage
# Description: canonical hello-world output text must equal 'Hello, World!'
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: outputMessage.text === 'Hello, World!'
exit 0
