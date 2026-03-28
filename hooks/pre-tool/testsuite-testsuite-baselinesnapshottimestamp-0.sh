#!/bin/bash
# Invariant: testSuite.baselineSnapshotTimestamp > 0
# Entity: TestSuite
# Description: the baseline must be timestamped; without a timestamp, 'previously passing' has no temporal anchor and any state could be claimed as the baseline
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: testSuite.baselineSnapshotTimestamp > 0
exit 0
