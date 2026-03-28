#!/bin/bash
# Invariant: unit.evaluatedAt > 0
# Entity: TypeScriptCompilationUnit
# Description: an unevaluated compilation unit (timestamp zero) has never been compiled and cannot report pass/fail
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: unit.evaluatedAt > 0
exit 0
