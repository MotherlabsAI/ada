#!/bin/bash
# Invariant: tsBuildInfo.filePath.endsWith('.tsbuildinfo')
# Entity: TsBuildInfo
# Description: incremental cache file must use .tsbuildinfo extension
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: tsBuildInfo.filePath.endsWith('.tsbuildinfo')
exit 0
