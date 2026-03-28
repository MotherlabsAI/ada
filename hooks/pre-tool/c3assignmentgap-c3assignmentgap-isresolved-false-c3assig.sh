#!/bin/bash
# Invariant: c3AssignmentGap.isResolved === false || c3AssignmentGap.candidatePackages.includes(c3AssignmentGap.resolvedPackage as WorkspacePackageName)
# Entity: C3AssignmentGap
# Description: the resolved package must be one of the declared candidates; resolving to a non-candidate package bypasses the collapse strategy constraints
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: c3AssignmentGap.isResolved === false || c3AssignmentGap.candidatePackages.includes(c3AssignmentGap.resolvedPackage as WorkspacePackageName)
exit 0
