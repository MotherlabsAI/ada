#!/bin/bash
# Invariant: pipelineStage.usesLLM === false || ['INT','PER','ENT','PRO','SYN','VER','GOV'].includes(pipelineStage.stageCode)
# Entity: PipelineStage
# Description: only the 7 LLM stages may be non-deterministic; CTX and BLD are always deterministic
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineStage.usesLLM === false || ['INT','PER','ENT','PRO','SYN','VER','GOV'].includes(pipelineStage.stageCode)
exit 0
