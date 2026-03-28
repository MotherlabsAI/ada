#!/bin/bash
# Invariant: record.provenanceIntact === record.hops.every(h => h.isTraced)
# Entity: ProvenanceChainRecord
# Description: the provenanceIntact flag must reflect the actual traced state of all hops — a mismatch is a false provenance claim
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: record.provenanceIntact === record.hops.every(h => h.isTraced)
exit 0
