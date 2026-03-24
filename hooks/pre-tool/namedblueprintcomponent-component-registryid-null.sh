#!/bin/bash
# Invariant: component.registryId !== null
# Entity: NamedBlueprintComponent
# Description: every component must be anchored to the BlueprintComponentRegistry that owns it — orphaned components break G7
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: component.registryId !== null
exit 0
