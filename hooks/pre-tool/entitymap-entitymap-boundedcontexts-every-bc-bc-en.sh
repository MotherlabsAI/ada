#!/bin/bash
# Invariant: entityMap.boundedContexts.every(bc => bc.entities.includes(bc.rootEntity))
# Entity: EntityMap
# Description: Root entity must be a member of its bounded context's entity set — without this, the context is structurally incoherent
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMap.boundedContexts.every(bc => bc.entities.includes(bc.rootEntity))
exit 0
