#!/bin/bash
# Invariant: testSuite.packageName !== null && testSuite.packageName.length > 0
# Entity: TestSuite
# Description: each suite must be scoped to a package so regressions can be localized to the package that changed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: testSuite.packageName !== null && testSuite.packageName.length > 0
exit 0
