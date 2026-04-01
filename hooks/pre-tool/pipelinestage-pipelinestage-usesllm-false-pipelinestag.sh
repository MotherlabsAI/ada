#!/bin/bash
# Invariant: pipelineStage.usesLLM === false || pipelineStage.deterministic === false
# Entity: PipelineStage
# Description: LLM-using stages produce non-deterministic output — CTX and BLD are the only deterministic stages
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineStage.usesLLM === false || pipelineStage.deterministic === false
exit 0
