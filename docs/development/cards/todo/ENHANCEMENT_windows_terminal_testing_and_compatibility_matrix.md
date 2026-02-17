# Enhancement Card: Windows Terminal Testing and Compatibility Matrix Update

## Status

- **Status**: NOT STARTED
- **Priority**: LOW (compatibility; after or alongside terminal spec and matrix stub)
- **Created**: 2026-02-14

## Context

**Current State**:
- **FEATURE_build_distribution_and_terminal_compatibility** left **Windows** support as “pending testing”: document likelihood of Windows terminals supporting the game and which environments (CMD, PowerShell, Windows Terminal, WSL) work.
- The project will maintain a **compatibility matrix** (README or wiki) with Terminal | Platform | Status. Matrix is to be stubbed by **ENHANCEMENT_stub_terminal_compatibility_matrix**.

**Location**:
- Client: `src/render/Renderer.js`, `src/utils/terminal.js`, input handling (raw mode, key codes).
- Docs: Compatibility matrix (README or `docs/development/wiki/terminal-compatibility.md`).

## Problem

- We don’t yet know how well the game runs on Windows terminals (CMD, PowerShell, Windows Terminal, WSL). Without testing and documentation, Windows users may hit raw-mode or key-encoding issues with no guidance.
- The compatibility matrix needs real data for Windows platforms; this card produces that and any follow-up fixes or docs.

## Desired Outcome

1. **Test on Windows environments**
   - Run the client (and optionally server) in at least: **Windows Terminal**, **PowerShell**, **CMD**, and **WSL** (if available). Record: does the game start, render correctly, accept arrow keys and special keys (ESC, Q, etc.), and handle resize (full redraw)?

2. **Document results**
   - Update the **compatibility matrix** with rows for each tested combination (e.g. Terminal: Windows Terminal, Platform: Windows 11, Status: supported / may work / unsupported). Note any quirks (e.g. “arrow keys need WSL” or “CMD not supported”).

3. **Optional fixes or docs**
   - If we find fixable issues (e.g. key-code normalization for one terminal), implement or file follow-up cards. If we document “best effort” or “unsupported” for some environments, add a short note to README or terminal compatibility spec.

4. **Feed back into spec**
   - If testing reveals open points (e.g. “PowerShell raw mode differs”), add them to **ENHANCEMENT_create_terminal_compatibility_spec** open points or to the parent feature card’s Follow-up questions.

## Requirements

- Testing is manual or semi-automated (e.g. run client, try keys, resize). No requirement for full CI on Windows in this card (CI is **ENHANCEMENT_ci_setup_github_actions**); focus is on one-off or occasional testing and matrix update.
- Matrix must be updated with Windows-related results; other platforms can be filled in separately.

## Dependencies

- **ENHANCEMENT_stub_terminal_compatibility_matrix**: Matrix must exist to be updated. Can be done in parallel (stub first, then this card fills Windows rows).
- **ENHANCEMENT_create_terminal_compatibility_spec**: Optional; spec can reference “see compatibility matrix for Windows results.” This card can add open points to the spec if needed.

## Documentation

- **Deliverable**: Updated compatibility matrix (README or wiki) with Windows terminal rows and any README/spec notes.
- **SPECS**: Terminal compatibility spec (if created) may be updated with “supported” vs. “may work” for Windows based on results.

## Related Cards

- **FEATURE_build_distribution_and_terminal_compatibility**: Parent card; “Where to go from here” option 3 (spin-off). Windows support was an open question.
- **ENHANCEMENT_stub_terminal_compatibility_matrix**: Provides the matrix to update.
- **ENHANCEMENT_create_terminal_compatibility_spec**: Spec to align with; may get open points from this testing.

## Tags

- `enhancement`
- `testing`
- `terminal`
- `compatibility`
- `windows`
