#!/bin/bash
# Invariant: cliProgram.requiresBuildStep === false || cliProgram.runtime !== null || cliProgram.entryPoint !== null
# Entity: CLIProgram
# Description: program must have either a build artifact or a runtime to be executable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: cliProgram.requiresBuildStep === false || cliProgram.runtime !== null || cliProgram.entryPoint !== null
exit 0
