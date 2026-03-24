#!/bin/bash
# Invariant: state.typescriptCompiles === (state.typescriptErrorCount === 0)
# Entity: CodebaseIntegrityState
# Description: TypeScript compilation status must be exactly zero errors; non-zero errors mean the codebase is broken regardless of other passing checks
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: state.typescriptCompiles === (state.typescriptErrorCount === 0)
exit 0
