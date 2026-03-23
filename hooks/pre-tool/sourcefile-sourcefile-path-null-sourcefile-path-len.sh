#!/bin/bash
# Invariant: sourceFile.path !== null && sourceFile.path.length > 0
# Entity: SourceFile
# Description: source file must have a non-empty path
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: sourceFile.path !== null && sourceFile.path.length > 0
exit 0
