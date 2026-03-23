#!/bin/bash
# Invariant: executable.filePath !== null && executable.filePath.length > 0
# Entity: Executable
# Description: executable must have a resolvable file path
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: executable.filePath !== null && executable.filePath.length > 0
exit 0
