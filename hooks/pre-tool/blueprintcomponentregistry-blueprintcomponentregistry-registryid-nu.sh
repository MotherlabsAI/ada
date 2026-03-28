#!/bin/bash
# Invariant: blueprintComponentRegistry.registryId !== null && blueprintComponentRegistry.registryId.length > 0
# Entity: BlueprintComponentRegistry
# Description: without a registryId no assignment or provenance record can reference this registry
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprintComponentRegistry.registryId !== null && blueprintComponentRegistry.registryId.length > 0
exit 0
