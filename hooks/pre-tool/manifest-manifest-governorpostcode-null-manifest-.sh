#!/bin/bash
# Invariant: manifest.governorPostcode !== null && manifest.governorPostcode.length > 0
# Entity: Manifest
# Description: the governor postcode must be recorded — it enables verification that the governing decision was authentic
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: manifest.governorPostcode !== null && manifest.governorPostcode.length > 0
exit 0
