#!/bin/bash
# Invariant: entryPoint.shebang !== null || entryPoint.functionName !== null
# Entity: EntryPoint
# Description: entry point must have either a shebang (interpreted) or a named function (compiled)
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entryPoint.shebang !== null || entryPoint.functionName !== null
exit 0
