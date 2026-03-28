#!/bin/bash
# Invariant: unit.passed === (unit.errorCount === 0)
# Entity: TypeScriptCompilationUnit
# Description: a compilation unit passes if and only if it has zero errors — a mismatch is a corrupt result
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: unit.passed === (unit.errorCount === 0)
exit 0
