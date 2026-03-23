#!/bin/bash
# Invariant: cliProgram.shebang !== null || cliProgram.interpreter !== null
# Entity: CLIProgram
# Description: program must declare an interpreter via shebang or be a compiled binary
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: cliProgram.shebang !== null || cliProgram.interpreter !== null
exit 0
