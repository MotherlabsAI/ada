#!/bin/bash
# Invariant: pipelineState.governor !== null ? pipelineState.verify !== null : true
# Entity: PipelineState
# Description: If a governor decision exists then an audit report must exist — the Governor cannot decide without a completed AuditReport
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineState.governor !== null ? pipelineState.verify !== null : true
exit 0
