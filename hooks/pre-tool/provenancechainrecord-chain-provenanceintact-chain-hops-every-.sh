#!/bin/bash
# Invariant: chain.provenanceIntact === chain.hops.every(h => h.isTraced)
# Entity: ProvenanceChainRecord
# Description: chain integrity is exactly the conjunction of all hop tracings; partial tracing means the chain is not intact
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: chain.provenanceIntact === chain.hops.every(h => h.isTraced)
exit 0
