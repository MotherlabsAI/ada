#!/bin/bash
# Invariant: suite.totalTests === suite.passedTests + suite.failedTests
# Entity: TestSuiteResult
# Description: total must be the sum of passed and failed — any other value means tests are unaccounted for
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: suite.totalTests === suite.passedTests + suite.failedTests
exit 0
