#!/bin/bash
# Invariant: cliProgram.entryPoint !== null && cliProgram.entryPoint.length > 0
# Entity: CLIProgram
# Description: program must reference a non-empty entry point path
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: cliProgram.entryPoint !== null && cliProgram.entryPoint.length > 0
exit 0
