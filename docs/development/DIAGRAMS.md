# Mermaid diagram (.mmd) locations and purpose

This document lists where Mermaid (`.mmd`) source files live and what each diagram is meant to describe. SVG output is generated from these files for use in specs and docs.

## Generating SVG files

From the project root:

```bash
npm run diagrams:generate
```

This runs `node scripts/generate-diagrams.js`, which finds all `.mmd` files (excluding `node_modules`, `.git`, `logs`, `data`) and converts each to a same-named `.svg` in the same directory using `@mermaid-js/mermaid-cli` (mmdc) with a white background.

To generate only under specific directories:

```bash
node scripts/generate-diagrams.js docs/development/specs/terminal-game/server
node scripts/generate-diagrams.js docs/development/specs/terminal-game/server docs/development/specs/terminal-game/client
```

Use `node scripts/generate-diagrams.js --help` for usage.

---

## Diagram locations

### Terminal game

All terminal-game diagram locations and purposes: **[specs/terminal-game/DIAGRAMS.md](specs/terminal-game/DIAGRAMS.md)** (overall, renderer, server, client).

---

## Summary

- **Single script:** `npm run diagrams:generate` — one entry point for diagram generation (from repo root).
- **Terminal game:** Source of truth for terminal-game `.mmd` files and their purpose: [specs/terminal-game/DIAGRAMS.md](specs/terminal-game/DIAGRAMS.md).
- **Output:** Each `.mmd` produces a matching `.svg` in the same directory (white background).
