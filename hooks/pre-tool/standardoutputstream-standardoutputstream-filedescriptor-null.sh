#!/bin/bash
# Invariant: standardOutputStream.fileDescriptor !== null
# Entity: StandardOutputStream
# Description: stream must have a defined file descriptor
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: standardOutputStream.fileDescriptor !== null
exit 0
