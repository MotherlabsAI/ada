#!/bin/bash
# Invariant: standardOutputStream.streamType === 'stdout' || standardOutputStream.streamType === 'stderr'
# Entity: StandardOutputStream
# Description: stream type must be either stdout or stderr
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: standardOutputStream.streamType === 'stdout' || standardOutputStream.streamType === 'stderr'
exit 0
