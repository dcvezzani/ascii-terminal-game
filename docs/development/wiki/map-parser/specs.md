# Map Parser Utility Specifications

## Overview
A Node.js utility that converts a text-based map file to a compressed JSON format using run-length encoding.

## Requirements

### Input
- **File Format**: Text file containing a grid map with configurable dimensions
- **Dimensions**: Configurable columns and rows (default: 60x25, strict validation)
- **Characters**: 
  - `#` = block (entity: 1)
  - `@` = spawn (entity: 2)  
  - ` ` = empty space (entity: 0)

### Output
- **File Format**: JSON file written to current directory
- **Structure**: Top-level JSON array of cell objects with `entity`/`repeat` properties (run-length encoded). Matches the schema consumed by the server board loader.
- **Example Format**:
```json
[
  { "entity": 1, "repeat": 60 },
  { "entity": 0, "repeat": 10 },
  { "entity": 1, "repeat": 1 }
]
```

### Utility Interface
- **Language**: JavaScript (Node.js)
- **Input Method**: Command line argument for text file path
- **Output**: JSON file written to current working directory
- **Error Handling**: Throw error for invalid dimensions or file issues

#### Example Usage
```bash
node map-parser.js /path/to/map1.txt
# Creates: map1.json in current directory
```

## Implementation Plan

### Core Functions
1. **File Reader**: Load and validate text file
2. **Dimension Validator**: Ensure grid matches configured dimensions
3. **Character Mapper**: Convert #/@/ to entity values (0, 1, 2)
4. **Run-Length Encoder**: Compress using entity/repeat format
5. **JSON Writer**: Save to current directory

### Configuration Constants
- **DEFAULT_WIDTH**: 60 (configurable)
- **DEFAULT_HEIGHT**: 25 (configurable)
- **CHARACTER_MAPPING**: Fixed mapping of #/@/ to entity values (0, 1, 2)

### Error Cases to Handle
- File not found
- Invalid file permissions
- Incorrect dimensions
- Invalid characters
- Write permission issues

### File Naming Convention
- Input: `{name}.txt`
- Output: `{name}.json`

## Related documentation

- **Board Parsing** ([../../specs/terminal-game/board-parsing/SPEC_Board_Parsing.md](../../specs/terminal-game/board-parsing/SPEC_Board_Parsing.md)) — Board JSON schema (entity/repeat, RLE) consumed by the server.

## Technical Considerations
- Use `fs` module for file operations
- Use `process.argv` for command line arguments
- Configurable dimensions via constants at top of module
- Strict validation for production reliability
- Efficient run-length encoding algorithm