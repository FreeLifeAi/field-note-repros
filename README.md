# Free Life AI Labs: Research Field Note Reproductions (`v0.1.1`)

**License**: `Apache-2.0` (see [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE))  
**Security Policy**: [`SECURITY.md`](SECURITY.md) (`Contact@freelifeai.com`)  
**Author**: Free Life AI Labs Inc. (Toronto, Ontario, Canada | https://freelifeai.com/research/)  
**Principal Architect**: Leonid Majbits (`Leon@freelifeai.com`)  
**Runtime Floor**: Node.js `>=24.0.0` (`0` npm dependencies; built-in `node:sqlite`, `node:crypto`, `node:http`, `node:assert`)

This repository provides bounded, deterministic reproduction harnesses, scoring rubrics, and mathematical/statistical verifiers accompanying the three laboratory Field Notes published at https://freelifeai.com/research/.

## Provenance & Scope Disclosure

Where original internal runs operated over private multi-session operational logs or live local camera hardware, the fixtures in this repository are **explicitly labeled synthetic reproductions** that isolate and verify the exact storage, schema-evaluation, permutation-test, and dynamical-systems mechanisms without exposing private operational records.

* **[`repros/fn01_cas_and_drift.mjs`](repros/fn01_cas_and_drift.mjs)** -> **[Field Note 01: Optimistic CAS and Semantic Drift](https://freelifeai.com/research/notes/cas-and-semantic-drift/)**:
  Reproduces atomic SQLite Compare-And-Swap (`HTTP 409` stale-parent rejection with preserved conflict logging) alongside a deterministic objection-retention rubric demonstrating how a valid-parent prose compaction (`2.52x` observed compression ratio on this synthetic fixture; `~2.2x` in the published Field Note 01 study) can pass storage CAS while silently dropping an unresolved technical objection unless pending objections are carried as structured fields.
* **[`repros/fn02_schema_order_2x2.mjs`](repros/fn02_schema_order_2x2.mjs)** -> **[Field Note 02: Schema Order and Mid-Chain Intent Dilution](https://freelifeai.com/research/notes/schema-order-and-intent-dilution/)**:
  Provides the exact JSON tool/response schemas, paired `2x2` factorial harness (`choice-first` vs `explanation-first` crossed with `repetition-padded` vs `clean` prompt templates), deterministic JSON property-order SHA-256 digest check, and deterministic scorer separating **governing-fact recall** (`4/4` in the published 24B choice-first baseline) from **compatible action selection** (`0/4` baseline vs `3/3` under the combined field-order and padding repair). Includes an optional OpenAI-compatible local endpoint runner (`LOCAL_LLM_URL` / `LOCAL_LLM_MODEL`) for re-running live local weights (`llama.cpp` / `vLLM`).
* **[`repros/fn03_sensory_bounds.mjs`](repros/fn03_sensory_bounds.mjs)** -> **[Field Note 03: Sub-15ms Zero-Retention Sensory Boundaries](https://freelifeai.com/research/notes/local-sensory-boundaries/)**:
  Independently verifies (1) the exact critical-slowing scalar recurrence $z_{k+1} = \tanh(z_k)$ from $z_0 = 0.5$ ($z_{32} \approx 0.197951$, $|z_{k+1} - z_k| < 10^{-5}$ at iteration `1,547` / `1,548`), (2) the exact `B = 199` (`200`-total) block-permutation surrogate p-value estimator $\hat{p} = (1 + r) / (B + 1)$ whose minimum resolution floor is `1 / 200 = 0.0050`, and (3) why a non-significant negative-control p-value (`p = 0.7150`) is distinct from an empirical false-alarm upper bound (`0 / N` observed alarms bounded via exact one-sided `95%` Clopper-Pearson confidence intervals), plus a `16x16` zero-retention summary-only buffer benchmark.

## Run All Verifiers

Requires Node.js `>=24.0.0`:

```bash
npm test

# Optional: run Field Note 02 2x2 factorial against a local OpenAI-compatible endpoint
LOCAL_LLM_URL=http://127.0.0.1:8080 LOCAL_LLM_MODEL=qwen2.5-24b node repros/fn02_schema_order_2x2.mjs
```
