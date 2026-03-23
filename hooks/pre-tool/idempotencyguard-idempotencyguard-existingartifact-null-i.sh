#!/bin/bash
# Invariant: idempotencyGuard.existingArtifact !== null ? idempotencyGuard.existingArtifact.runId.value === idempotencyGuard.runId.value : true
# Entity: IdempotencyGuard
# Description: if an existing artifact is found, its run ID must match the guard's run ID
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: idempotencyGuard.existingArtifact !== null ? idempotencyGuard.existingArtifact.runId.value === idempotencyGuard.runId.value : true
exit 0
