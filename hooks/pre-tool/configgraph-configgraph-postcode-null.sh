#!/bin/bash
# Invariant: configGraph.postcode !== null
# Entity: ConfigGraph
# Description: ConfigGraph must carry a postcode — it is a typed output artifact requiring provenance
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: configGraph.postcode !== null
exit 0
