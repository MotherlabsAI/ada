#!/bin/bash
# Invariant: synGate.upstreamStage !== null && synGate.upstreamStage.length > 0
# Entity: SYNGate
# Description: Upstream stage must be named — a gate with no upstream reference cannot enforce sequential preconditions
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: synGate.upstreamStage !== null && synGate.upstreamStage.length > 0
exit 0
