#!/bin/bash
# Invariant: record.primaryComponentId !== record.collapsedComponentId
# Entity: CollapseRecord
# Description: a component cannot collapse into itself — two distinct components must be named
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: record.primaryComponentId !== record.collapsedComponentId
exit 0
