# Enhancement Card: Stub Terminal Compatibility Matrix

## Status

- **Status**: NOT STARTED
- **Priority**: LOW (enables living doc; does not block other work)
- **Created**: 2026-02-14

## Context

**Current State**:
- **FEATURE_build_distribution_and_terminal_compatibility** decided to maintain a **compatibility matrix** in the project (README or dedicated doc), updated as we learn more. No matrix exists yet.
- The matrix should list terminals and platforms with status: supported / may work / untested.

**Location**:
- Deliverable: Main **README** (new “Terminal compatibility” section) and/or `docs/development/wiki/terminal-compatibility.md`.

## Problem

- Without a stub, “maintain a compatibility matrix” has no place to live. Testing and user feedback would have nowhere to be recorded consistently.
- A small, initial table makes the decision actionable and can be filled in as we test or get reports.

## Desired Outcome

Add a short **“Terminal compatibility”** section to the project that:

1. **Table**
   - Include a table with columns such as: **Terminal** | **Platform** | **Status** (e.g. supported / may work / untested). Initially many rows can be “untested” or placeholder; the structure is what matters.

2. **Placement**
   - Either in the **main README** or in `docs/development/wiki/terminal-compatibility.md` with a link from the README. Decision can be “README for visibility” vs. “wiki for length” based on project preference.

3. **Optional short prose**
   - One or two sentences: we support a short list of terminals (to be filled after spec); others may work and we document as we learn. Link to **FEATURE_build_distribution_and_terminal_compatibility** or the terminal compatibility spec once it exists.

4. **Living doc**
   - Section is intended to be updated when we run tests (e.g. Windows terminal testing card) or get compatibility feedback; no one-time-only requirement.

## Requirements

- Table is clearly visible and easy to extend (add rows, change status).
- No need to fill every cell before considering this card done; stubbing the structure is sufficient.

## Dependencies

- None. Can be done before or in parallel with **ENHANCEMENT_create_terminal_compatibility_spec**; the spec will reference “the compatibility matrix in README (or wiki).”

## Documentation

- **Deliverable**: README section and/or `docs/development/wiki/terminal-compatibility.md` with the table and brief intro.

## Related Cards

- **FEATURE_build_distribution_and_terminal_compatibility**: Parent card; “Where to go from here” option 2 (stub matrix).
- **ENHANCEMENT_create_terminal_compatibility_spec**: Spec will define supported vs. “may work” and reference this matrix.
- **ENHANCEMENT_windows_terminal_testing_and_compatibility_matrix**: Will fill in Windows-related rows in the matrix.

## Tags

- `enhancement`
- `documentation`
- `terminal`
- `compatibility`
- `readme`
