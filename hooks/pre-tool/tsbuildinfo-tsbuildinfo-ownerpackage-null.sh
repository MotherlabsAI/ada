#!/bin/bash
# Invariant: tsBuildInfo.ownerPackage !== null
# Entity: TsBuildInfo
# Description: tsbuildinfo must be associated with a package
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: tsBuildInfo.ownerPackage !== null
exit 0
