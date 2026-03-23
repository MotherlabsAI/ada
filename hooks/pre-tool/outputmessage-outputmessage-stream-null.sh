#!/bin/bash
# Invariant: outputMessage.stream !== null
# Entity: OutputMessage
# Description: output message must target a defined stream
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: outputMessage.stream !== null
exit 0
