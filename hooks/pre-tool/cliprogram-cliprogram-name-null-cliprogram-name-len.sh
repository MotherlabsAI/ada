#!/bin/bash
# Invariant: cliProgram.name !== null && cliProgram.name.length > 0
# Entity: CLIProgram
# Description: program must have a non-empty name
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: cliProgram.name !== null && cliProgram.name.length > 0
exit 0
