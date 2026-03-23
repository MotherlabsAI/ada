#!/bin/bash
# Invariant: cliProgram.runtime !== null
# Entity: CLIProgram
# Description: program must be associated with a runtime
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: cliProgram.runtime !== null
exit 0
