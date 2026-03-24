#!/bin/bash
# Invariant: record.actionType !== null && record.actionType.length > 0
# Entity: ENTProvenanceRecord
# Description: action type identifies what mapping or extraction event produced this record — null action type makes G9 audit entries untriageable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: record.actionType !== null && record.actionType.length > 0
exit 0
