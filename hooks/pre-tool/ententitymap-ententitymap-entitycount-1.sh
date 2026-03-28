#!/bin/bash
# Invariant: entEntityMap.entityCount >= 1
# Entity: ENTEntityMap
# Description: G4 requires the EntityMap to be populated; zero entities means extraction failed and G4 is not satisfied
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entEntityMap.entityCount >= 1
exit 0
