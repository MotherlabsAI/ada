#!/bin/bash
# Invariant: buildStep.inputSource !== null
# Entity: BuildStep
# Description: build step must reference a source file
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: buildStep.inputSource !== null
exit 0
