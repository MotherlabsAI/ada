# Test pack (the A8 experiment)

Build the booking feature TWICE: once from this pack, once from only the raw
intent. For each, run `node c/checks/verify.mjs --defect` against the result's
data layer. The pack run should make the no-double-booking guarantee obvious and
enforced; the raw run usually will not. That delta is the product thesis (AXIOM A8).
