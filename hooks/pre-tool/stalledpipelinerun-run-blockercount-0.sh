#!/bin/bash
# Invariant: run.blockerCount >= 0
# Entity: StalledPipelineRun
# Description: blocker count cannot be negative — negative counts are structurally incoherent
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: run.blockerCount >= 0
exit 0
