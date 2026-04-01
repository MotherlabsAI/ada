#!/bin/bash
# Invariant: buildContract.fileTree.length >= 1
# Entity: BuildContract
# Description: a contract with an empty file tree has no files to write — it cannot fulfill its build mandate
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: buildContract.fileTree.length >= 1
exit 0
