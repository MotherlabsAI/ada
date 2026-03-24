#!/bin/bash
# Invariant: blueprintComponent.boundedContext !== null && blueprintComponent.boundedContext.length > 0
# Entity: BlueprintComponent
# Description: Component must belong to a bounded context — decontextualized components break architectural coherence
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprintComponent.boundedContext !== null && blueprintComponent.boundedContext.length > 0
exit 0
