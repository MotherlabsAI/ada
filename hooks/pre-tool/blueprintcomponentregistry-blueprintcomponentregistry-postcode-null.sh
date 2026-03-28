#!/bin/bash
# Invariant: blueprintComponentRegistry.postcode !== null && blueprintComponentRegistry.postcode.length > 0
# Entity: BlueprintComponentRegistry
# Description: the registry must have a provenance postcode so downstream assignments can trace back to it
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprintComponentRegistry.postcode !== null && blueprintComponentRegistry.postcode.length > 0
exit 0
