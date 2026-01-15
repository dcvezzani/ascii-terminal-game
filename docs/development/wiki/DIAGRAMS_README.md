# Mermaid Diagram Generation

This document describes the Mermaid (`.mmd`) diagram files that document the server and client architecture. These diagrams can be converted to SVG format for viewing in documentation or embedding in markdown files.

## Available Diagrams

### Server Architecture Diagrams

Located in `docs/development/specs/server-architecture_SPECS/`:

1. **`server-architecture_components.mmd`** - Component structure diagram showing all 8 server components and their relationships
2. **`server-architecture_interactions_1-initialization.mmd`** - Server initialization sequence
3. **`server-architecture_interactions_2-connection.mmd`** - Client connection flow
4. **`server-architecture_interactions_3-movement.mmd`** - Player movement validation and execution
5. **`server-architecture_interactions_4-broadcast.mmd`** - Periodic state broadcasting flow
6. **`server-architecture_interactions_5-disconnect.mmd`** - Client disconnection and cleanup
7. **`server-architecture_data-structures.mmd`** - Class diagram showing data structures and internal organization

### Client Architecture Diagrams

Located in `docs/development/specs/client-architecture_SPECS/`:

1. **`client-architecture_components.mmd`** - Component structure diagram showing all client components and their relationships
2. **`client-architecture_interactions_1-initialization.mmd`** - Client initialization and component setup
3. **`client-architecture_interactions_2-connection.mmd`** - WebSocket connection and initial state flow
4. **`client-architecture_interactions_3-movement-prediction.mmd`** - Movement input with client-side prediction
5. **`client-architecture_interactions_4-state-update.mmd`** - State update and reconciliation flow
6. **`client-architecture_interactions_5-rendering.mmd`** - Rendering flow (full vs incremental decision)
7. **`client-architecture_data-structures.mmd`** - Class diagram showing state management and data structures

## Generating SVG Files

### Option 1: Generate All Diagrams Automatically

The easiest way to generate all SVG files:

```bash
npm run diagrams:generate
```

This script automatically finds all `.mmd` files in the project and converts them to `.svg` files.

**Generate specific directories:**
```bash
# Generate only server diagrams
node scripts/generate-diagrams.js docs/development/specs/server-architecture_SPECS

# Generate only client diagrams
node scripts/generate-diagrams.js docs/development/specs/client-architecture_SPECS

# Generate both server and client
node scripts/generate-diagrams.js docs/development/specs/server-architecture_SPECS docs/development/specs/client-architecture_SPECS
```

### Option 2: Generate Server Diagrams

Generate server architecture diagrams:

```bash
# Component structure diagram
npm run diagrams:components

# All interaction sequence diagrams
npm run diagrams:interactions

# Individual interaction diagrams
npm run diagrams:interactions:init
npm run diagrams:interactions:connection
npm run diagrams:interactions:movement
npm run diagrams:interactions:broadcast
npm run diagrams:interactions:disconnect

# Data structures diagram
npm run diagrams:data-structures

# All server diagrams
npm run diagrams:all
```

### Option 3: Generate Client Diagrams

Generate client architecture diagrams:

```bash
# Component structure diagram
npm run diagrams:client:components

# All interaction sequence diagrams
npm run diagrams:client:interactions

# Individual interaction diagrams
npm run diagrams:client:init
npm run diagrams:client:connection
npm run diagrams:client:movement
npm run diagrams:client:state
npm run diagrams:client:rendering

# Data structures diagram
npm run diagrams:client:data

# All client diagrams
npm run diagrams:client:all
```

### Option 4: Generate Specific Directories

Use the enhanced script to target specific directories:

```bash
# Show help
node scripts/generate-diagrams.js --help

# Generate diagrams in specific directory
node scripts/generate-diagrams.js docs/development/specs/server-architecture_SPECS

# Generate diagrams in multiple directories
node scripts/generate-diagrams.js docs/development/specs/server-architecture_SPECS docs/development/specs/client-architecture_SPECS
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

1. Create a new `.mmd` file in the appropriate directory:
   - Server diagrams: `docs/development/specs/server-architecture_SPECS/`
   - Client diagrams: `docs/development/specs/client-architecture_SPECS/`
   - Or any other directory in the project
2. Run `npm run diagrams:generate` to automatically convert it
3. Or use the directory-specific script: `node scripts/generate-diagrams.js <directory>`
4. Optionally add a specific script to `package.json` if you want a named command

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

### Directory Not Found
- Ensure directory paths are relative to project root
- Use `node scripts/generate-diagrams.js --help` to see usage
- Check that directories exist before running

## Diagram Types Supported

The Mermaid CLI supports all Mermaid diagram types:
- Flowcharts (component structure)
- Sequence diagrams (interactions)
- Class diagrams (data structures)
- State diagrams
- Entity relationship diagrams
- Gantt charts
- And more...

See [Mermaid Documentation](https://mermaid.js.org/) for syntax reference.

## Diagram Organization

Diagrams are organized by architecture:

- **Server Architecture**: `docs/development/specs/server-architecture_SPECS/`
  - Components, interactions, and data structures for the game server
  
- **Client Architecture**: `docs/development/specs/client-architecture_SPECS/`
  - Components, interactions, and data structures for the game client

Each directory contains:
- `.mmd` files (Mermaid source)
- `.svg` files (generated diagrams)
- `README.md` (architecture specification)
