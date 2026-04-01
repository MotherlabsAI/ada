#!/bin/bash
# Invariant: projectRecord.runCount >= 1
# Entity: ProjectRecord
# Description: a project record with zero runs has never been compiled — it should not exist in storage
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: projectRecord.runCount >= 1
exit 0
