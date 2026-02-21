# Mermaid diagram generation

**Canonical reference:** [../DIAGRAMS.md](../DIAGRAMS.md) — entry point for diagram locations and generation. For the full list of terminal-game diagram files and purposes, see [specs/terminal-game/DIAGRAMS.md](../specs/terminal-game/DIAGRAMS.md).

## Generate SVG files

```bash
npm run diagrams:generate
```

This finds all `.mmd` files in the project and converts them to `.svg` (same directory, white background). To limit to specific directories:

```bash
node scripts/generate-diagrams.js docs/development/specs/terminal-game/diagrams docs/development/specs/terminal-game/server docs/development/specs/terminal-game/client
```

See `../DIAGRAMS.md` for the full map of diagram locations and purposes.

## Manual single-file conversion

```bash
npx mmdc -i input.mmd -o output.svg -b white
```

## Requirements

- Node.js; dev dependency `@mermaid-js/mermaid-cli` (uses Puppeteer/Chromium).
