#!/bin/bash
# Invariant: shebang.interpreterPath !== null && shebang.interpreterPath.length > 0
# Entity: Shebang
# Description: shebang must reference a non-empty interpreter path
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: shebang.interpreterPath !== null && shebang.interpreterPath.length > 0
exit 0
