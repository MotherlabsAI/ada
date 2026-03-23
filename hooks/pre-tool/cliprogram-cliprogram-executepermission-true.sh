#!/bin/bash
# Invariant: cliProgram.executePermission === true
# Entity: CLIProgram
# Description: program file must have execute permission set
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: cliProgram.executePermission === true
exit 0
