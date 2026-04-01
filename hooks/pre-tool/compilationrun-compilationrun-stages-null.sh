#!/bin/bash
# Invariant: compilationRun.stages !== null
# Entity: CompilationRun
# Description: the stages array must exist; a null stages field means no stage execution evidence is recorded and G9's sequential constraint cannot be audited
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.stages !== null
exit 0
