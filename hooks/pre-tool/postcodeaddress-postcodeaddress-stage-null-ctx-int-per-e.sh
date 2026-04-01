#!/bin/bash
# Invariant: postcodeAddress.stage !== null && ['CTX','INT','PER','ENT','PRO','SYN','VER','GOV','BLD'].includes(postcodeAddress.stage)
# Entity: PostcodeAddress
# Description: stage must be one of the 9 canonical stage codes
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: postcodeAddress.stage !== null && ['CTX','INT','PER','ENT','PRO','SYN','VER','GOV','BLD'].includes(postcodeAddress.stage)
exit 0
