#!/bin/bash
# Invariant: file.relatedGoals.length >= 1
# Entity: MonorepoSourceFile
# Description: every required source file must relate to at least one goal — otherwise it is unmotivated work
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: file.relatedGoals.length >= 1
exit 0
