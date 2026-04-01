#!/bin/bash
# Invariant: buildContract.fileTree.length > 0
# Entity: BuildContract
# Description: file tree must have at least one node — an empty file tree cannot produce an implementation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: buildContract.fileTree.length > 0
exit 0
