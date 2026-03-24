#!/bin/bash
# Invariant: run.resumable === true
# Entity: StalledPipelineRun
# Description: G4 requires resumption not recreation — a non-resumable run must be forked, destroying audit continuity
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: run.resumable === true
exit 0
