#!/bin/bash
# Invariant: projectRecord.lastBlueprintPostcode !== null && projectRecord.lastBlueprintPostcode.length > 0
# Entity: ProjectRecord
# Description: the project record must reference the last compiled blueprint — this enables ada scan and ada resume to find prior state
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: projectRecord.lastBlueprintPostcode !== null && projectRecord.lastBlueprintPostcode.length > 0
exit 0
