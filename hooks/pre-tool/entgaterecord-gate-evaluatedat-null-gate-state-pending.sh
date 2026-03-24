#!/bin/bash
# Invariant: gate.evaluatedAt !== null ? gate.state !== 'PENDING' : true
# Entity: ENTGateRecord
# Description: evaluated gates must not remain in PENDING state; an evaluated gate with PENDING state is a contradiction
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gate.evaluatedAt !== null ? gate.state !== 'PENDING' : true
exit 0
