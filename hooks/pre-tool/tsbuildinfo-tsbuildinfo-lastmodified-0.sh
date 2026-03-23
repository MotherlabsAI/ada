#!/bin/bash
# Invariant: tsBuildInfo.lastModified > 0
# Entity: TsBuildInfo
# Description: modification timestamp must be positive
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: tsBuildInfo.lastModified > 0
exit 0
