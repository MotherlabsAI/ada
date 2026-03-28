#!/bin/bash
# Invariant: provenanceChainRecord.chainId !== null && provenanceChainRecord.chainId.length > 0
# Entity: ProvenanceChainRecord
# Description: the chain must be uniquely identified so ENTGateRecord can reference it when evaluating provenanceIntact
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainRecord.chainId !== null && provenanceChainRecord.chainId.length > 0
exit 0
