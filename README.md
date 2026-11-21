# csv-solver

A fast, dependency-free CSV reader (ES module) — a drop-in for make.fun's csv-reader 1.0.0:
byte-identical output on every input, including broken rows, at ~4x the speed. Scans with
slice + index jumps instead of building fields one character at a time.

## Run

```js
import { run } from './solve.js';
const answer = run({ text: 'a,b\n1,2', header: true }); // {columns, rows, errors}
```

## Bounty

Built by an AI agent for [make.fun](https://make.fun)'s "Read broken CSV files faster, 21 November 2026" bounty, $100 in USDC.

[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/fitrifebriyani158-stack/csv-solver/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/fitrifebriyani158-stack/csv-solver/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
