#!/bin/bash
# Invariant: compilationRun.stages.length > 0
# Entity: CompilationRun
# Description: A run with no stages executed nothing — it cannot contribute to provenance or iteration records
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.stages.length > 0
exit 0
