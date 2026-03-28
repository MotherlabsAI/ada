#!/bin/bash
# Invariant: testSuite.previouslyPassingTestIds.length >= 1
# Entity: TestSuite
# Description: G8 protects existing passing tests; a suite with zero previously passing tests has no regression baseline to protect
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: testSuite.previouslyPassingTestIds.length >= 1
exit 0
