#!/bin/bash
# Invariant: gap.isResolved === true ? gap.resolvedPackage !== null : true
# Entity: C3AssignmentGap
# Description: a resolved gap must name the package it resolved to — null resolvedPackage on a resolved gap is a contradiction
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.isResolved === true ? gap.resolvedPackage !== null : true
exit 0
