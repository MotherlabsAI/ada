#!/bin/bash
# Invariant: postcodeAddress.prefix === "ML"
# Entity: PostcodeAddress
# Description: All postcodes must carry the ML namespace prefix — without this cross-package postcode comparison is ambiguous
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: postcodeAddress.prefix === "ML"
exit 0
