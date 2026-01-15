# Mermaid Diagram Generation

This directory contains Mermaid (`.mmd`) diagram files that document the server architecture. These diagrams can be converted to SVG format for viewing in documentation or embedding in markdown files.

## Available Diagrams

1. **`server-architecture_components.mmd`** - Component structure diagram showing all 8 server components and their relationships
2. **`server-architecture_interactions.mmd`** - Sequence diagrams showing component interactions (5 different flows)
3. **`server-architecture_data-structures.mmd`** - Class diagram showing data structures and internal organization

## Generating SVG Files

### Option 1: Generate All Diagrams Automatically

The easiest way to generate all SVG files:

```bash
npm run diagrams:generate
```

This script automatically finds all `.mmd` files in the project and converts them to `.svg` files.

### Option 2: Generate Individual Diagrams

Generate specific diagrams:

```bash
# Component structure diagram
npm run diagrams:components

# Interaction sequence diagrams
npm run diagrams:interactions

# Data structures diagram
npm run diagrams:data-structures
```

### Option 3: Generate All Known Diagrams

Generate all three known diagrams:

```bash
npm run diagrams:all
```

## Manual Conversion

If you need to convert a diagram manually:

```bash
# Using npx (no global install needed)
npx mmdc -i input.mmd -o output.svg -b white

# Or if installed globally
mmdc -i input.mmd -o output.svg -b white
```

## Viewing Diagrams

### Online
- **Mermaid Live Editor**: https://mermaid.live/
  - Paste `.mmd` content to preview
  - Export as SVG directly

### VS Code
- Install "Markdown Preview Mermaid Support" extension
- Open `.mmd` files to preview

### GitHub/GitLab
- Both platforms render Mermaid diagrams directly in markdown
- Use code blocks with `mermaid` language:
  ````markdown
  ```mermaid
  graph TB
    A --> B
  ```
  ````

## Adding New Diagrams

1. Create a new `.mmd` file in this directory (or any directory)
2. Run `npm run diagrams:generate` to automatically convert it
3. Or add a specific script to `package.json` if you want a named command

## Requirements

- Node.js (for npm scripts)
- `@mermaid-js/mermaid-cli` package (installed as dev dependency)

The Mermaid CLI uses Puppeteer internally, which requires Chromium. This is automatically handled by npm install.

## Troubleshooting

### "Command not found: mmdc"
- Run `npm install` to ensure dependencies are installed
- Use `npx mmdc` instead of `mmdc` if not installed globally

### Puppeteer/Chromium Issues
- The CLI will download Chromium automatically on first use
- If issues persist, try: `npm install @mermaid-js/mermaid-cli --force`

### SVG Output Issues
- Check that the `.mmd` syntax is valid (use Mermaid Live Editor to validate)
- Ensure output directory exists
- Check file permissions

## Diagram Types Supported

The Mermaid CLI supports all Mermaid diagram types:
- Flowcharts
- Sequence diagrams
- Class diagrams
- State diagrams
- Entity relationship diagrams
- Gantt charts
- And more...

See [Mermaid Documentation](https://mermaid.js.org/) for syntax reference.
