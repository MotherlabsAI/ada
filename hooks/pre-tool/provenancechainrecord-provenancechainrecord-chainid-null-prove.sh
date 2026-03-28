#!/bin/bash
# Invariant: provenanceChainRecord.chainId !== null && provenanceChainRecord.chainId.length > 0
# Entity: ProvenanceChainRecord
# Description: without a chainId the record cannot be referenced by ENTGateRecord.provenanceIntact evaluation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainRecord.chainId !== null && provenanceChainRecord.chainId.length > 0
exit 0
