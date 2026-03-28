#!/bin/bash
# Invariant: entity.sourceComponentId !== null
# Entity: CanonicalEntity
# Description: every CanonicalEntity must trace to a source BlueprintComponent — orphaned entities break provenance
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entity.sourceComponentId !== null
exit 0
