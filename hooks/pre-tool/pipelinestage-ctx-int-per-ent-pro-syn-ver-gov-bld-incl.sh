#!/bin/bash
# Invariant: ['CTX','INT','PER','ENT','PRO','SYN','VER','GOV','BLD'].includes(pipelineStage.stageCode)
# Entity: PipelineStage
# Description: stageCode must be one of the 9 canonical stage codes — no synthetic stages may exist
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ['CTX','INT','PER','ENT','PRO','SYN','VER','GOV','BLD'].includes(pipelineStage.stageCode)
exit 0
