#!/bin/bash
# Invariant: sourceFile.language !== null && sourceFile.language.length > 0
# Entity: SourceFile
# Description: source file must declare a language
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: sourceFile.language !== null && sourceFile.language.length > 0
exit 0
