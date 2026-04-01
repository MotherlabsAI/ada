#!/bin/bash
# Invariant: skill.sourceSessionIds.length >= 2
# Entity: Skill
# Description: a skill must be sourced from at least 2 distinct sessions before promotion — single-session patterns may be noise
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: skill.sourceSessionIds.length >= 2
exit 0
