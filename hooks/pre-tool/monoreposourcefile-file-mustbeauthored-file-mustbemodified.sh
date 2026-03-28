#!/bin/bash
# Invariant: file.mustBeAuthored || file.mustBeModified
# Entity: MonorepoSourceFile
# Description: a MonorepoSourceFile that requires neither authoring nor modification is not a change target and should not be in this set
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: file.mustBeAuthored || file.mustBeModified
exit 0
