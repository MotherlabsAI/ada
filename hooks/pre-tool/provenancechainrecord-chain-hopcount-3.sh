#!/bin/bash
# Invariant: chain.hopCount === 3
# Entity: ProvenanceChainRecord
# Description: three-hop is a correctness invariant declared by G2; a chain with fewer hops is incomplete and cannot pass the gate
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: chain.hopCount === 3
exit 0
