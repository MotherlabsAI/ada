#!/bin/bash
# Invariant: blueprintComponentRegistry.components.length === blueprintComponentRegistry.totalComponentCount
# Entity: BlueprintComponentRegistry
# Description: component count must match the actual array length; a mismatch indicates a partial write
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprintComponentRegistry.components.length === blueprintComponentRegistry.totalComponentCount
exit 0
