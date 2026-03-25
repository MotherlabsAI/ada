#!/bin/bash
# Ada post-tool audit — appends a compact record to .ada/session-log.jsonl
# Fires after every Bash/Edit/Write/Read/MultiEdit tool call, unconditionally.
# This is a pure observer: always exits 0, never blocks.

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "unknown"' 2>/dev/null || echo "unknown")
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // ""' 2>/dev/null || echo "")
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // ""' 2>/dev/null || echo "")

# Resolve project dir: prefer CLAUDE_PROJECT_DIR, fall back to cwd
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-${ADA_PROJECT_DIR:-$(pwd)}}"
LOG_FILE="$PROJECT_DIR/.ada/session-log.jsonl"

# Ensure .ada directory exists
mkdir -p "$PROJECT_DIR/.ada"

# Extract a compact path or command summary from tool input
case "$TOOL_NAME" in
  Write|Edit|MultiEdit)
    PATH_HINT=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""' 2>/dev/null || echo "")
    ;;
  Bash)
    PATH_HINT=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null | cut -c1-80 || echo "")
    ;;
  Read)
    PATH_HINT=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""' 2>/dev/null || echo "")
    ;;
  *)
    PATH_HINT=""
    ;;
esac

TS=$(date +%s)

# Append one JSON line — compact, append-only, never overwrites
printf '{"ts":%d,"session":"%s","tool":"%s","path":"%s"}\n' \
  "$TS" "$SESSION_ID" "$TOOL_NAME" "$PATH_HINT" >> "$LOG_FILE"

exit 0
