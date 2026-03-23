#!/bin/bash
# Invariant: cliProgram.sourceFile !== null
# Entity: CLIProgram
# Description: program must reference a source file
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: cliProgram.sourceFile !== null
exit 0
