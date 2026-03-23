#!/bin/bash
# Invariant: outputMessage.text !== null
# Entity: OutputMessage
# Description: output message text must not be null
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: outputMessage.text !== null
exit 0
