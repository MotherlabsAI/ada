#!/bin/bash
# Invariant: suite.regressionCount >= 0
# Entity: TestSuiteResult
# Description: regression count cannot be negative — a negative value is a corrupt measurement
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: suite.regressionCount >= 0
exit 0
