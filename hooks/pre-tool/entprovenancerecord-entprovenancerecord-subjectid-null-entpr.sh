#!/bin/bash
# Invariant: entProvenanceRecord.subjectId !== null && entProvenanceRecord.subjectId.length > 0
# Entity: ENTProvenanceRecord
# Description: every record must identify what it is recording provenance for; subjectless records cannot be linked to a hop node
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entProvenanceRecord.subjectId !== null && entProvenanceRecord.subjectId.length > 0
exit 0
