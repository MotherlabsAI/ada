#!/bin/bash
# Invariant: stageExecutionRecord.postcode !== null
# Entity: StageExecutionRecord
# Description: every stage execution must produce a content-addressed output — a record without a postcode has no provenance anchor
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stageExecutionRecord.postcode !== null
exit 0
