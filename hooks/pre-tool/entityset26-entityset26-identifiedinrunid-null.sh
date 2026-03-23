#!/bin/bash
# Invariant: entitySet26.identifiedInRunId !== null
# Entity: EntitySet26
# Description: set must be traceable to the run in which its members were identified
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entitySet26.identifiedInRunId !== null
exit 0
