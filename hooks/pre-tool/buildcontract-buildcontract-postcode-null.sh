#!/bin/bash
# Invariant: buildContract.postcode !== null
# Entity: BuildContract
# Description: the build contract must be content-addressed — it is the final artifact in the compilation provenance chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: buildContract.postcode !== null
exit 0
