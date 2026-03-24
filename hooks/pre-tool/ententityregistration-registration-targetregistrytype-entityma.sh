#!/bin/bash
# Invariant: registration.targetRegistryType === "EntityMap"
# Entity: ENTEntityRegistration
# Description: ENT-stage registrations must target EntityMap specifically; other registries are out of scope for this stage
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: registration.targetRegistryType === "EntityMap"
exit 0
