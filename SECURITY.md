# Security Policy

## Reporting Issues

Please report suspected defects, mathematical or statistical discrepancies, or security issues in these reproduction harnesses by email to:

- **Contact**: `Contact@freelifeai.com`

Include the Node.js version, commit SHA or release tag, and a minimal reproduction command. We acknowledge reports within 3 business days.

## Scope

This repository (`@freelifeai/field-note-repros` `v0.1.1`) contains standalone synthetic reproduction harnesses, scoring rubrics, and statistical verifiers accompanying Free Life AI Labs Research Field Notes 01, 02, and 03. By default, `npm test` runs offline over deterministic synthetic fixtures (`0` external network requests); optional live model evaluation in `repros/fn02_schema_order_2x2.mjs` is only invoked when `LOCAL_LLM_URL` is explicitly set by the caller.
