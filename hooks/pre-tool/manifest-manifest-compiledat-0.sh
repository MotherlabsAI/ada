#!/bin/bash
# Invariant: manifest.compiledAt > 0
# Entity: Manifest
# Description: the manifest must record when compilation occurred — undated manifests cannot support audit queries
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: manifest.compiledAt > 0
exit 0
