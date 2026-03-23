#!/bin/bash
# Invariant: cliProgram.exitCode !== null
# Entity: CLIProgram
# Description: program must define an exit code
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: cliProgram.exitCode !== null
exit 0
