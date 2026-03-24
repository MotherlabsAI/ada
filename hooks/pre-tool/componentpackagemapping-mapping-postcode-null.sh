#!/bin/bash
# Invariant: mapping.postcode !== null
# Entity: ComponentPackageMapping
# Description: postcode is required for three-hop provenance chain traceability (G5)
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: mapping.postcode !== null
exit 0
