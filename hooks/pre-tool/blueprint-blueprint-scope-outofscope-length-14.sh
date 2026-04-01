#!/bin/bash
# Invariant: blueprint.scope.outOfScope.length >= 14
# Entity: Blueprint
# Description: all 14 explicit out-of-scope constraints must be captured in scope.outOfScope — omitting them removes enforcement boundaries
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.scope.outOfScope.length >= 14
exit 0
