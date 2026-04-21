#!/bin/bash
INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"' 2>/dev/null || echo "unknown")
END_REASON=$(echo "$INPUT" | jq -r '.end_reason // "unknown"' 2>/dev/null || echo "unknown")
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-${ADA_PROJECT_DIR:-$(pwd)}}"
SESSIONS_DIR="$PROJECT_DIR/.ada/sessions"
mkdir -p "$SESSIONS_DIR"
TS=$(date +%s)
cat > "$SESSIONS_DIR/${SESSION_ID}.json" <<EOF
{"sessionId":"$SESSION_ID","endReason":"$END_REASON","completedAt":$TS}
EOF
exit 0