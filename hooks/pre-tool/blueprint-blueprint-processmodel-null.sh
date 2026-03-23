#!/bin/bash
# Invariant: blueprint.processModel !== null
# Entity: Blueprint
# Description: blueprint must embed a process model — a blueprint without processes is behaviourally incomplete
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.processModel !== null
exit 0
