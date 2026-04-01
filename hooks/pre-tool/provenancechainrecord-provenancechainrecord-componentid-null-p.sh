#!/bin/bash
# Invariant: provenanceChainRecord.componentId !== null && provenanceChainRecord.componentId.length > 0
# Entity: ProvenanceChainRecord
# Description: componentId must be non-null — the chain must reference the component whose provenance is being validated
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainRecord.componentId !== null && provenanceChainRecord.componentId.length > 0
exit 0
