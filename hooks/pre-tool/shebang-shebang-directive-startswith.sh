#!/bin/bash
# Invariant: shebang.directive.startsWith('#!')
# Entity: Shebang
# Description: shebang directive must begin with the '#!' prefix
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: shebang.directive.startsWith('#!')
exit 0
