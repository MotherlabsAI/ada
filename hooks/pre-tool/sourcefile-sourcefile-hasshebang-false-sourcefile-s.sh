#!/bin/bash
# Invariant: sourceFile.hasShebang === false || sourceFile.shebangLine !== null
# Entity: SourceFile
# Description: if shebang flag is true a shebang line must be present
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: sourceFile.hasShebang === false || sourceFile.shebangLine !== null
exit 0
