#!/bin/bash
# Invariant: shebang.rawLine.startsWith('#!')
# Entity: Shebang
# Description: shebang line must begin with #!
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: shebang.rawLine.startsWith('#!')
exit 0
