#!/bin/bash
# Invariant: runtime.isCompiled !== null
# Entity: Runtime
# Description: runtime must declare whether it requires a build step
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runtime.isCompiled !== null
exit 0
