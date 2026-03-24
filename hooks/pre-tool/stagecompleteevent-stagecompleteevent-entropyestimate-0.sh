#!/bin/bash
# Invariant: stageCompleteEvent.entropyEstimate >= 0
# Entity: StageCompleteEvent
# Description: Entropy estimate must be non-negative — it is a semantic distance measure
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stageCompleteEvent.entropyEstimate >= 0
exit 0
