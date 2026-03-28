#!/bin/bash
# Invariant: record.chainId !== null && record.chainId.length > 0
# Entity: ProvenanceChainRecord
# Description: a chain without an ID cannot be referenced by the ENTGateRecord during provenance verification
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: record.chainId !== null && record.chainId.length > 0
exit 0
