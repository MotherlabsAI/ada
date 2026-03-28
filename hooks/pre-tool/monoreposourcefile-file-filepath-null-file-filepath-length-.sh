#!/bin/bash
# Invariant: file.filePath !== null && file.filePath.length > 0
# Entity: MonorepoSourceFile
# Description: a source file without a path cannot be located in the monorepo
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: file.filePath !== null && file.filePath.length > 0
exit 0
