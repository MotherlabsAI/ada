#!/bin/bash
# Invariant: runtime.executablePath !== null && runtime.executablePath.length > 0
# Entity: Runtime
# Description: runtime must have a resolvable executable path
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runtime.executablePath !== null && runtime.executablePath.length > 0
exit 0
