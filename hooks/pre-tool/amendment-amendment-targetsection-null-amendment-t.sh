#!/bin/bash
# Invariant: amendment.targetSection !== null && amendment.targetSection.length > 0
# Entity: Amendment
# Description: an amendment must identify what section of the blueprint it targets — untargeted amendments cannot be applied
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: amendment.targetSection !== null && amendment.targetSection.length > 0
exit 0
