#!/bin/bash
# Invariant: mapping.isTotal === true ? mapping.postcode !== null : true
# Entity: ComponentPackageMapping
# Description: a total mapping must have a provenance postcode so the ENT gate can reference it as evidence of completeness
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: mapping.isTotal === true ? mapping.postcode !== null : true
exit 0
