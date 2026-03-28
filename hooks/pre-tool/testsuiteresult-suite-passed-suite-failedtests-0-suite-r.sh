#!/bin/bash
# Invariant: suite.passed === (suite.failedTests === 0 && suite.regressionCount === 0)
# Entity: TestSuiteResult
# Description: a suite passes only when there are no failed tests and no regressions — G11 is only satisfied when this holds for all packages
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: suite.passed === (suite.failedTests === 0 && suite.regressionCount === 0)
exit 0
