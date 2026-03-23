---
name: schema-test
description: "Use to test all 7 agent schemas against real model output. Run before any full pipeline run."
---

# Schema validation test

Tests each agent's prompt against its Zod schema with a live model call.
Takes ~3 minutes. Tells you exactly which schemas fail and why.

```bash
cd /Users/motherlabs/Desktop/ada-claude && ./scripts/test-schemas.sh
```

Must show 7/7 passed before running ada init.
