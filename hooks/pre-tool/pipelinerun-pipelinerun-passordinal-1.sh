#!/bin/bash
# Invariant: pipelineRun.passOrdinal >= 1
# Entity: PipelineRun
# Description: Pass ordinal must be at least 1 — it is a 1-indexed sequence number
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineRun.passOrdinal >= 1
exit 0
