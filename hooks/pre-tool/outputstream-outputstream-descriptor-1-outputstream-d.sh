#!/bin/bash
# Invariant: outputStream.descriptor === 1 || outputStream.descriptor === 2
# Entity: OutputStream
# Description: stream must be stdout (1) or stderr (2)
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: outputStream.descriptor === 1 || outputStream.descriptor === 2
exit 0
