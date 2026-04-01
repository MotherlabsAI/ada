#!/bin/bash
# Invariant: ['CTX','BLD'].includes(pipelineStage.stageCode) ? pipelineStage.usesLLM === false : true
# Entity: PipelineStage
# Description: CTX and BLD are deterministic pure functions; they must never invoke an LLM
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ['CTX','BLD'].includes(pipelineStage.stageCode) ? pipelineStage.usesLLM === false : true
exit 0
