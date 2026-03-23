#!/bin/bash
# Invariant: intStage.entropyThreshold === 0.30
# Entity: INTStage
# Description: entropy threshold is hard-fixed at 0.30 and never runtime-configurable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intStage.entropyThreshold === 0.30
exit 0
