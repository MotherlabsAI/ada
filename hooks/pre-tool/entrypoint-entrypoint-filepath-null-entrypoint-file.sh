#!/bin/bash
# Invariant: entryPoint.filePath !== null && entryPoint.filePath.length > 0
# Entity: EntryPoint
# Description: entry point must have a resolvable file path
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entryPoint.filePath !== null && entryPoint.filePath.length > 0
exit 0
