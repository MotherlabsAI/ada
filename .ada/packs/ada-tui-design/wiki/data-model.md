# Data model — the design contract

## Role tokens (60/30/10 chrome) — contrast measured on bg `#1B1410`

| token | hex | tier | contrast↑bg | AA |
|---|---|---|---|---|
| `bg` | #1B1410 | base | — | — |
| `surface` | #251D16 | base | — | — |
| `surfaceAlt` | #2F2419 | base | — | — |
| `text` | #ECDDC9 | structure | 13.65 | ✓ AA |
| `textDim` | #B49B80 | structure | 6.88 | ✓ AA |
| `textMuted` | #7A6650 | structure | 3.33 | △ AA-large |
| `border` | #4A3A2C | structure | — | — |
| `accent` | #D59632 | accent | 7.14 | ✓ AA |
| `accentBright` | #E8A94A | accent | — | — |
| `focus` | #C66A43 | accent | 4.8 | ✓ AA |
| `selection` | #3A281C | accent | — | — |
| `success` | #3E8F5A | status | 4.58 | ✓ AA |
| `warning` | #D59632 | status | 7.14 | ✓ AA |
| `error` | #B65A6B | status | 4.04 | △ AA-large |

> ✗/△ rows are exactly what the `contrast_aa` check pins. `textMuted` as body text is the headline defect.

## Pigment palette (meaning / category)

| pigment | hex | role |
|---|---|---|
| `terracotta` | #B8543C | brand identity / active area |
| `plum` | #6E5ACF | secondary identity (mascot, compile heartbeat) |
| `clay` | #C66A43 | warm area hue |
| `amber` | #D59632 | warm area hue / warning |
| `sage` | #7E9C76 | cool-neutral area hue |
| `green` | #3E8F5A | check ok |
| `cyan` | #2F8FA3 | followable edge / link |
| `slate` | #8893A6 | compiles-to / structural (AA-fixed) |
| `deep_blue` | #4E7FB5 | area hue (AA-large fixed) |
| `rose` | #B65A6B | failure |

## Components (live, in `src/tui/ink/`)

- `Welcome.ts` — compiled home (banner + menu + sidebar + projects + hints)
- `StatusBar.ts` — workbench top row (pack identity + counts)
- `art.ts` — wordmark, mascot, gradient, star frames
- `tokens.ts` / `theme.ts` — the two-tier colour system
- `App.ts` — the fixed status/body/footer skeleton + mode-keyed input
