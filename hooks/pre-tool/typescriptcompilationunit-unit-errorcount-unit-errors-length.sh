#!/bin/bash
# Invariant: unit.errorCount === unit.errors.length
# Entity: TypeScriptCompilationUnit
# Description: declared error count must match actual error entries
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: unit.errorCount === unit.errors.length
exit 0
