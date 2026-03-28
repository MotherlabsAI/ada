#!/bin/bash
# Invariant: entProvenanceRecord.subjectId !== null && entProvenanceRecord.subjectId.length > 0
# Entity: ENTProvenanceRecord
# Description: without a subjectId the record cannot be matched to the component or entity it documents
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entProvenanceRecord.subjectId !== null && entProvenanceRecord.subjectId.length > 0
exit 0
