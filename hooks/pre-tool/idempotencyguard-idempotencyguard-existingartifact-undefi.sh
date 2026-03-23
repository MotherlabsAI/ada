#!/bin/bash
# Invariant: idempotencyGuard.existingArtifact !== undefined
# Entity: IdempotencyGuard
# Description: existingArtifact is null when absent, never undefined — absent vs. present is always deterministic
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: idempotencyGuard.existingArtifact !== undefined
exit 0
