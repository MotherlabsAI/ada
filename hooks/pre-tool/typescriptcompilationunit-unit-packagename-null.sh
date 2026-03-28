#!/bin/bash
# Invariant: unit.packageName !== null
# Entity: TypeScriptCompilationUnit
# Description: a compilation unit must be bound to a package — unbound compilation results cannot be attributed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: unit.packageName !== null
exit 0
