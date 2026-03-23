#!/bin/bash
# Invariant: shellEnvironment.PATH !== null && shellEnvironment.PATH.length > 0
# Entity: ShellEnvironment
# Description: PATH must be a non-empty list of directories
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: shellEnvironment.PATH !== null && shellEnvironment.PATH.length > 0
exit 0
