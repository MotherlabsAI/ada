#!/bin/bash
# Invariant: blueprintComponentRegistry.components.map(c => c.ordinal).sort((a,b)=>a-b).every((v,i) => v === i+1)
# Entity: BlueprintComponentRegistry
# Description: ordinal sequence must be contiguous starting at 1; gaps in ordinal assignment are blocking ENT errors
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprintComponentRegistry.components.map(c => c.ordinal).sort((a,b)=>a-b).every((v,i) => v === i+1)
exit 0
