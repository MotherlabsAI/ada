#!/bin/bash
# Invariant: provenanceGate.timestamp > 0
# Entity: ProvenanceGate
# Description: Gate evaluation must be timestamped — auditability requires temporal ordering of enforcement events
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceGate.timestamp > 0
exit 0
