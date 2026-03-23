#!/bin/bash
# Invariant: exitCode.meaning !== null && exitCode.meaning.length > 0
# Entity: ExitCode
# Description: exit code must carry a non-empty meaning description
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: exitCode.meaning !== null && exitCode.meaning.length > 0
exit 0
