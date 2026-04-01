#!/bin/bash
# Invariant: provenanceChain.hopCount === 3 || /* for non-ENT chains */ provenanceChain.hopCount >= 1
# Entity: ProvenanceChain
# Description: ENT-stage artifacts must have exactly 3 hops back to IntentGraph — fewer hops break traceability
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChain.hopCount === 3 || /* for non-ENT chains */ provenanceChain.hopCount >= 1
exit 0
