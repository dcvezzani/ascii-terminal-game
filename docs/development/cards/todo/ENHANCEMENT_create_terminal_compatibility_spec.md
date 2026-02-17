# Enhancement Card: Create Terminal Compatibility Spec

## Status

- **Status**: NOT STARTED
- **Priority**: LOW (foundational; unblocks compatibility testing and matrix)
- **Created**: 2026-02-14

## Context

**Current State**:
- Terminal compatibility decisions are captured in **FEATURE_build_distribution_and_terminal_compatibility** (Open Questions & Answers). There is no formal specification that turns those decisions into requirements for runtime behavior, testing, and documentation.
- Decisions include: supported vs. “may work” terminal list, require minimum ANSI and show clear error if not met, board dimensions from board config, full redraw on resize, plain mode when no color, compatibility matrix in README, and input/README note.

**Location**:
- Spec output: `docs/development/specs/terminal-compatibility/` (or equivalent under `docs/development/specs/`).

## Problem

- Without a written spec, “terminal compatibility” is scattered across the feature card. Runtime checks (e.g. minimum ANSI, too-small terminal), resize behavior, and color fallbacks have no single contract. The compatibility matrix (stubbed separately) would lack a spec to align with.
- A terminal compatibility spec gives a clear contract for required behavior and what to document in the matrix.

## Desired Outcome

Create a **Terminal compatibility spec** under `docs/development/specs/` that:

1. **Supported vs. “may work”**
   - Define a short **supported** list (e.g. macOS Terminal, iTerm2, Windows Terminal, WSL default terminal) and state that other environments are **“may work”** and documented in the compatibility matrix (README).

2. **Minimum requirements and errors**
   - **ANSI**: Require a minimum level of ANSI support; **show a clear error** if not met (no silent degradation).
   - **Terminal size**: Minimum dimensions are driven by **board configuration** (not a single fixed size). Document when we refuse to start or show “terminal too small” and the exact message(s).

3. **Resize and redraw**
   - On terminal **resize mid-game**: **full redraw**, clearing everything first. (Alignment with center-board and other layout specs as needed.)

4. **Color**
   - For terminals **without color support**: **plain mode** is acceptable (e.g. no chalk, ASCII only). Specify how we detect or configure this and any UX text.

5. **Input**
   - Document that we document arrow keys and special keys (ESC, etc.) in the README; key-code normalization only if we observe issues. Reference compatibility matrix for input quirks.

6. **Compatibility matrix**
   - Spec states that the project maintains a **compatibility matrix** (e.g. in README or linked doc) with Terminal | Platform | Status; updated as we learn more.

7. **Open points**
   - Section for follow-up questions (e.g. Windows CMD vs. PowerShell vs. WSL support after testing); can reference parent feature card.

## Requirements

- Spec is written in the project’s usual spec style.
- All content is consistent with **FEATURE_build_distribution_and_terminal_compatibility** (Open Questions & Answers).
- Spec is the single source of truth for terminal compatibility behavior; compatibility matrix and implementation cards reference it.

## Dependencies

- **FEATURE_build_distribution_and_terminal_compatibility**: Source of decisions. No implementation dependency.

## Documentation

- **SPECS**: To be created as the deliverable: `docs/development/specs/terminal-compatibility/terminal-compatibility_SPECS.md` (or equivalent path).
- **README / Matrix**: Spec references the compatibility matrix (stubbed by **ENHANCEMENT_stub_terminal_compatibility_matrix**).

## Related Cards

- **FEATURE_build_distribution_and_terminal_compatibility**: Parent card; “Where to go from here” option 1 (create spec).
- **ENHANCEMENT_stub_terminal_compatibility_matrix**: Stubs the matrix; matrix content should align with this spec.
- **ENHANCEMENT_windows_terminal_testing_and_compatibility_matrix**: Implementation/testing; will update matrix and can discover open points for this spec.

## Tags

- `enhancement`
- `documentation`
- `spec`
- `terminal`
- `compatibility`
