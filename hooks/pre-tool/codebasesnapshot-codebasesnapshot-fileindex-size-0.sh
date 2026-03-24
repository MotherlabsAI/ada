#!/bin/bash
# Invariant: codebaseSnapshot.fileIndex.size > 0
# Entity: CodebaseSnapshot
# Description: File index must contain at least one file — a snapshot with no files has no structural content to analyze
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: codebaseSnapshot.fileIndex.size > 0
exit 0
