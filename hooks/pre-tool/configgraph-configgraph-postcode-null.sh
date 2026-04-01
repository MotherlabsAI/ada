#!/bin/bash
# Invariant: configGraph.postcode !== null
# Entity: ConfigGraph
# Description: the output configuration graph must be content-addressed to participate in the provenance chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: configGraph.postcode !== null
exit 0
