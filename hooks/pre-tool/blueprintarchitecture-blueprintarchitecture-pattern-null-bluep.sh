#!/bin/bash
# Invariant: blueprintArchitecture.pattern !== null && blueprintArchitecture.pattern.length > 0
# Entity: BlueprintArchitecture
# Description: Architecture pattern must be named — unnamed patterns cannot be referenced in the vision document
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprintArchitecture.pattern !== null && blueprintArchitecture.pattern.length > 0
exit 0
