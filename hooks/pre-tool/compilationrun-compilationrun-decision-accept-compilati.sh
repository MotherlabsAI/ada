#!/bin/bash
# Invariant: compilationRun.decision === 'ACCEPT' ? compilationRun.blueprintPostcode !== null : true
# Entity: CompilationRun
# Description: blueprintPostcode must be present if and only if decision is ACCEPT
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.decision === 'ACCEPT' ? compilationRun.blueprintPostcode !== null : true
exit 0
