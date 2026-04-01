#!/bin/bash
# Invariant: manifest.blueprintPostcode !== null && manifest.blueprintPostcode.length > 0
# Entity: Manifest
# Description: the manifest must record the blueprint postcode — this is the entry point for provenance tracing
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: manifest.blueprintPostcode !== null && manifest.blueprintPostcode.length > 0
exit 0
