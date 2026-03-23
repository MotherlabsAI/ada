#!/bin/bash
# Invariant: outputStream.descriptor !== null && outputStream.descriptor.length > 0
# Entity: OutputStream
# Description: stream must have a named descriptor
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: outputStream.descriptor !== null && outputStream.descriptor.length > 0
exit 0
