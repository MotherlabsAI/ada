#!/bin/bash
# Invariant: compilationRun.blueprintPostcode !== null || compilationRun.decision !== 'ACCEPT'
# Entity: CompilationRun
# Description: a blueprintPostcode is required if and only if decision is ACCEPT — rejected runs produce no blueprint artifact
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.blueprintPostcode !== null || compilationRun.decision !== 'ACCEPT'
exit 0
