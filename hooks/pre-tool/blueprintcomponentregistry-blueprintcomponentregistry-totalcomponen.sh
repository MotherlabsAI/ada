#!/bin/bash
# Invariant: blueprintComponentRegistry.totalComponentCount === 10
# Entity: BlueprintComponentRegistry
# Description: the pipeline is invalid with any count other than 10; a wrong count means the registry is incomplete or corrupted
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprintComponentRegistry.totalComponentCount === 10
exit 0
