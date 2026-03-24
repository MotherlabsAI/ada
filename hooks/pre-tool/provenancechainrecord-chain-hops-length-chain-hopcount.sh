#!/bin/bash
# Invariant: chain.hops.length === chain.hopCount
# Entity: ProvenanceChainRecord
# Description: the hop array length must equal the declared hopCount or the record is internally inconsistent
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: chain.hops.length === chain.hopCount
exit 0
