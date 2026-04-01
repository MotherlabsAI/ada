#!/bin/bash
# Invariant: buildContract.acceptanceCriteria.length >= 1
# Entity: BuildContract
# Description: a contract with no acceptance criteria has no verifiable completion condition
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: buildContract.acceptanceCriteria.length >= 1
exit 0
