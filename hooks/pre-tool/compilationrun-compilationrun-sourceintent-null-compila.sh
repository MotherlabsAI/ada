#!/bin/bash
# Invariant: compilationRun.sourceIntent !== null && compilationRun.sourceIntent.trim().length > 0
# Entity: CompilationRun
# Description: run must preserve the original raw intent for provenance
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.sourceIntent !== null && compilationRun.sourceIntent.trim().length > 0
exit 0
