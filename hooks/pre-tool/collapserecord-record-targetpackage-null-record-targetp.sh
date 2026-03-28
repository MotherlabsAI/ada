#!/bin/bash
# Invariant: record.targetPackage !== null && record.targetPackage.length > 0
# Entity: CollapseRecord
# Description: the shared package target must be identified or the collapse produces no mapping
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: record.targetPackage !== null && record.targetPackage.length > 0
exit 0
