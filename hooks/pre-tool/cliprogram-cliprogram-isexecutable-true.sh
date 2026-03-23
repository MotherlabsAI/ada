#!/bin/bash
# Invariant: cliProgram.isExecutable === true
# Entity: CLIProgram
# Description: program file must be marked executable by the OS
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: cliProgram.isExecutable === true
exit 0
