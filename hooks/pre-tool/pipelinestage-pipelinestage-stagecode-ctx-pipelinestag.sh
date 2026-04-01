#!/bin/bash
# Invariant: pipelineStage.stageCode === 'CTX' || pipelineStage.stageCode === 'BLD' ? pipelineStage.usesLLM === false : true
# Entity: PipelineStage
# Description: CTX and BLD are deterministic and must never invoke an LLM
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineStage.stageCode === 'CTX' || pipelineStage.stageCode === 'BLD' ? pipelineStage.usesLLM === false : true
exit 0
