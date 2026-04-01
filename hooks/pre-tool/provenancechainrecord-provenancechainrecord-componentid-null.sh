#!/bin/bash
# Invariant: provenanceChainRecord.componentId !== null
# Entity: ProvenanceChainRecord
# Description: the chain must be anchored to a specific component; a null componentId makes the chain unattributable and unreferenceable by the ENTGateRecord
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainRecord.componentId !== null
exit 0
