#!/bin/bash
# Invariant: manifest.runId !== null && manifest.runId.length > 0
# Entity: Manifest
# Description: the manifest must reference a compilation run — an anonymous manifest cannot be traced to a pipeline execution
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: manifest.runId !== null && manifest.runId.length > 0
exit 0
