#!/bin/bash
# Invariant: provenanceGate.entropyEstimate >= 0
# Entity: ProvenanceGate
# Description: Entropy cannot be negative — semantic drift measurement requires a non-negative baseline
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceGate.entropyEstimate >= 0
exit 0
