#!/bin/bash
# Invariant: executable.isExecutablePermission === true
# Entity: Executable
# Description: executable file must have execute permission set
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: executable.isExecutablePermission === true
exit 0
