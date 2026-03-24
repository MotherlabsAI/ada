#!/bin/bash
# Invariant: chain.hops[0].hopIndex === 0 && chain.hops[1].hopIndex === 1 && chain.hops[2].hopIndex === 2
# Entity: ProvenanceChainRecord
# Description: hops must be in ordinal order within the tuple; out-of-order hops produce incorrect lineage tracing
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: chain.hops[0].hopIndex === 0 && chain.hops[1].hopIndex === 1 && chain.hops[2].hopIndex === 2
exit 0
