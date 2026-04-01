#!/bin/bash
# Invariant: pipelineStage.postcode !== null
# Entity: PipelineStage
# Description: every stage must produce a content-addressed postcode upon gate passage — no artifact without provenance
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineStage.postcode !== null
exit 0
