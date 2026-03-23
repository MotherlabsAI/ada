#!/bin/bash
# Invariant: blueprint.processFlows !== null
# Entity: Blueprint
# Description: process flows collection must be initialized
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.processFlows !== null
exit 0
