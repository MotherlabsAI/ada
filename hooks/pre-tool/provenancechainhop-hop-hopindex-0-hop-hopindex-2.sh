#!/bin/bash
# Invariant: hop.hopIndex >= 0 && hop.hopIndex <= 2
# Entity: ProvenanceChainHop
# Description: hop index must be 0 (component→package), 1 (package→stage), or 2 (stage→pipeline) — out-of-range indices are structurally incoherent for a 3-hop chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: hop.hopIndex >= 0 && hop.hopIndex <= 2
exit 0
