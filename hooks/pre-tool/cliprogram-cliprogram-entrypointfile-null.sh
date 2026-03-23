#!/bin/bash
# Invariant: cliProgram.entryPointFile !== null
# Entity: CLIProgram
# Description: program must designate exactly one entry point file
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: cliProgram.entryPointFile !== null
exit 0
