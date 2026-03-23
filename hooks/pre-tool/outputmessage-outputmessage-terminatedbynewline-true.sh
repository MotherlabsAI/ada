#!/bin/bash
# Invariant: outputMessage.terminatedByNewline === true
# Entity: OutputMessage
# Description: output line must be terminated by a newline
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: outputMessage.terminatedByNewline === true
exit 0
