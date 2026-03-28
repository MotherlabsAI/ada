#!/bin/bash
# Invariant: suite.evaluatedAt > 0
# Entity: TestSuiteResult
# Description: a suite with no evaluation timestamp was never run and cannot report pass/fail
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: suite.evaluatedAt > 0
exit 0
