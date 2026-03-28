#!/bin/bash
# Invariant: stalledPipelineRun.blockers.every(b => b.pipelineRunId === stalledPipelineRun.runId)
# Entity: StalledPipelineRun
# Description: every blocker must reference this run; cross-run blockers would corrupt the unblocking logic
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stalledPipelineRun.blockers.every(b => b.pipelineRunId === stalledPipelineRun.runId)
exit 0
