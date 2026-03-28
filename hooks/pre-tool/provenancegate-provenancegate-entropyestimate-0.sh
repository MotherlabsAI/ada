#!/bin/bash
# Invariant: provenanceGate.entropyEstimate >= 0
# Entity: ProvenanceGate
# Description: entropy is non-negative; a negative estimate signals a corrupt computation that would corrupt cumulativeEntropy in PipelineState
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceGate.entropyEstimate >= 0
exit 0
