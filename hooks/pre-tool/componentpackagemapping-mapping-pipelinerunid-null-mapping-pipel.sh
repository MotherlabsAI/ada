#!/bin/bash
# Invariant: mapping.pipelineRunId !== null && mapping.pipelineRunId.length > 0
# Entity: ComponentPackageMapping
# Description: mapping must be anchored to a pipeline run — unanchored mappings break G9 provenance audit trail
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: mapping.pipelineRunId !== null && mapping.pipelineRunId.length > 0
exit 0
