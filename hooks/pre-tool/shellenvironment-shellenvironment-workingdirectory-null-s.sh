#!/bin/bash
# Invariant: shellEnvironment.workingDirectory !== null && shellEnvironment.workingDirectory.length > 0
# Entity: ShellEnvironment
# Description: shell environment must have a defined working directory
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: shellEnvironment.workingDirectory !== null && shellEnvironment.workingDirectory.length > 0
exit 0
