#!/bin/bash
# Invariant: entrypointFile.filePermissions !== null
# Entity: EntrypointFile
# Description: file permissions must be defined
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entrypointFile.filePermissions !== null
exit 0
