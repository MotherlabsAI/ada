#!/bin/bash
# Invariant: codebaseSnapshot.fileIndex !== null
# Entity: CodebaseSnapshot
# Description: file index must be present
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: codebaseSnapshot.fileIndex !== null
exit 0
