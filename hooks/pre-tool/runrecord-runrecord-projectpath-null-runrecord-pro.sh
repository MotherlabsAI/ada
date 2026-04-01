#!/bin/bash
# Invariant: runRecord.projectPath !== null && runRecord.projectPath.length > 0
# Entity: RunRecord
# Description: a run record without a project path cannot be associated with a specific compilation target
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runRecord.projectPath !== null && runRecord.projectPath.length > 0
exit 0
