# Verify

```bash
node c/checks/verify.mjs                  # bundled clean dataset → all pass
node c/checks/verify.mjs --defect         # planted double-booking → no_double_booking FAILS
node c/checks/verify.mjs --data DATA.json  # run against your real data
node c/checks/verify.mjs --json            # machine-readable
```

Wire these into CI so every change is guarded. A failing check blocks acceptance.
