#!/bin/bash
# Invariant: projectRecord.projectPath !== null && projectRecord.projectPath.length > 0
# Entity: ProjectRecord
# Description: the project path is the primary key — an empty path cannot identify a target project
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: projectRecord.projectPath !== null && projectRecord.projectPath.length > 0
exit 0
