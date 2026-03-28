#!/bin/bash
# Invariant: compilationRun.runId !== null && compilationRun.runId.length > 0
# Entity: CompilationRun
# Description: without a non-empty runId no stage record, provenance chain, or gate can be associated to this execution
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.runId !== null && compilationRun.runId.length > 0
exit 0
