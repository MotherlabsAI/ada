#!/bin/bash
# Invariant: run.version !== null && run.version.length > 0
# Entity: StalledPipelineRun
# Description: version is part of the run identity (v1) — null version breaks run identity uniqueness
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: run.version !== null && run.version.length > 0
exit 0
