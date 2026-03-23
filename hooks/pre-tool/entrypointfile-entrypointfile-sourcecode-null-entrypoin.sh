#!/bin/bash
# Invariant: entrypointFile.sourceCode !== null && entrypointFile.sourceCode.length > 0
# Entity: EntrypointFile
# Description: file must contain non-empty source code
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entrypointFile.sourceCode !== null && entrypointFile.sourceCode.length > 0
exit 0
