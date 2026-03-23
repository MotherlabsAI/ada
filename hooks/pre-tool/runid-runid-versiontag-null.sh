#!/bin/bash
# Invariant: runId.versionTag !== null
# Entity: RunID
# Description: version tag must be present for traceability
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runId.versionTag !== null
exit 0
