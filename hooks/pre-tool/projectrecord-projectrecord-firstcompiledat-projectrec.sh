#!/bin/bash
# Invariant: projectRecord.firstCompiledAt <= projectRecord.lastCompiledAt
# Entity: ProjectRecord
# Description: firstCompiledAt must be chronologically before or equal to lastCompiledAt — inversion indicates a storage bug
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: projectRecord.firstCompiledAt <= projectRecord.lastCompiledAt
exit 0
