#!/bin/bash
# Invariant: outputMessage.trailingNewline === true
# Entity: OutputMessage
# Description: output must be terminated with a newline character
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: outputMessage.trailingNewline === true
exit 0
