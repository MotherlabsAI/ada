#!/bin/bash
# Invariant: compilationRun.sourceIntent !== null && compilationRun.sourceIntent.length > 0
# Entity: CompilationRun
# Description: Source intent must be preserved — a run without its origin cannot be audited for elicitation fidelity
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.sourceIntent !== null && compilationRun.sourceIntent.length > 0
exit 0
