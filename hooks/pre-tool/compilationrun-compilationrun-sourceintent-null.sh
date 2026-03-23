#!/bin/bash
# Invariant: compilationRun.sourceIntent !== null
# Entity: CompilationRun
# Description: every run must have a source intent
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.sourceIntent !== null
exit 0
