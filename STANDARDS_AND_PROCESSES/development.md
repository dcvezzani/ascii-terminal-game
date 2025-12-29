# Development Process Documentation

## Overview

This document describes the development process used for the Minifig Catalog project. The process is card-based, using feature cards, enhancement cards, and bug reports to track work, which are then converted into detailed specifications and gameplans for implementation.

**Version**: 1.0  
**Last Updated**: 2025-01-XX

---

## Table of Contents

1. [Initial Application Setup](#initial-application-setup)
2. [Card-Based Development Process](#card-based-development-process)
3. [Card to Specification Workflow](#card-to-specification-workflow)
4. [Gameplan Implementation Process](#gameplan-implementation-process)
5. [Git Commit Workflow](#git-commit-workflow)
6. [Testing Requirements](#testing-requirements)
7. [Review Process](#review-process)

---

## Initial Application Setup

### Root Documentation Files

Before using the card-based development process, the initial application is built using root-level documentation files:

#### `SPECS.md`

**Purpose**: Comprehensive specification document for the initial application setup.

**Contents**:

- Project overview and goals
- System architecture
- Data sources (ReBrickable API, SQLite database, CSV files)
- Core workflows (Phase 0-3):
  - Phase 0: Database Setup
  - Phase 1: Generate PAYLOAD_A
  - Phase 2: Generate Set Report
  - Phase 3: Manual Assignment Interface
- Data structures
- API endpoints
- File structure
- Success criteria

**Usage**: Used as the blueprint for building the initial application. All core functionality is specified here before implementation begins.

#### `GAMEPLAN.md`

**Purpose**: Step-by-step implementation plan for the initial application.

**Contents**:

- Prerequisites checklist
- Phase-by-phase implementation steps
- Time estimates
- Verification steps
- Command line usage
- Troubleshooting guide
- Success criteria

**Usage**: Followed sequentially to build the initial application. Each phase is completed before moving to the next.

### Initial Setup Process

1. **Read `SPECS.md`** to understand the system requirements
2. **Follow `GAMEPLAN.md`** phase by phase:
   - Phase 0: Setup & Database Creation
   - Phase 1: First Run - Generate PAYLOAD_A
   - Phase 2: Generate Set Report
   - Phase 3: Manual Assignment Interface
3. **Complete each phase** before moving to the next
4. **Verify success criteria** at the end of each phase
5. **Create git commits** after completing each phase

Once the initial application is complete, the card-based development process begins.

---

## Card-Based Development Process

### Directory Structure

**Important**: All development-based documents (cards, specs, gameplans) must be written to `./docs/development`.

```
docs/development/
├── cards/
│   ├── features/          # Feature cards (new functionality)
│   ├── enhancements/      # Enhancement cards (improvements to existing features)
│   └── bugs/             # Bug reports (defects to fix)
├── specs/                 # Specification documents
│   └── {feature-name}/    # Feature-specific specs
└── gameplans/             # Implementation gameplans
    └── {feature-name}/    # Feature-specific gameplans
```

### Card Types

#### Feature Cards (`docs/development/cards/features/FEATURE_*.md`)

**Purpose**: Document new features to be added to the application.

**Structure**:

- **Context**: Current state and location
- **Problem**: What problem this feature solves
- **Desired Feature**: High-level description
- **Requirements**: Functional requirements
- **Open Questions**: Questions to clarify before implementation
- **Related Features**: Links to related features/enhancements
- **Status**: Current status (NOT STARTED, IN PROGRESS, COMPLETE, etc.)
- **Priority**: Priority level
- **Dependencies**: Features this depends on

**Example**: `FEATURE_reconciliation_session_management.md`, `FEATURE_navigation_menu.md`

**Completion**: When a card is finished, rename it with "X_" prefix:
- `FEATURE_navigation_menu.md` → `X_FEATURE_navigation_menu.md`
- `ENHANCE_quantity_validation.md` → `X_ENHANCE_quantity_validation.md`
- `BUG_report_duplicate_minifigs.md` → `X_BUG_report_duplicate_minifigs.md`

**When to Create**:

- New major functionality is needed
- New user-facing feature is requested
- New system capability is required

#### Enhancement Cards (`docs/development/cards/enhancements/ENHANCE_*.md`)

**Purpose**: Document improvements to existing functionality.

**Structure**:

- **Context**: Current implementation
- **Problem**: What limitation or issue exists
- **Desired Enhancement**: What improvement is needed
- **Requirements**: Specific requirements
- **Benefits**: Why this enhancement is valuable
- **Approach**: Implementation approach
- **Related Files**: Files that will be modified
- **Status**: Current status

**Example**: `ENHANCE_quantity_validation.md`, `ENHANCE_lazy_loading_images.md`

**Completion**: When an enhancement card is finished, rename it with "X_" prefix:
- `ENHANCE_quantity_validation.md` → `X_ENHANCE_quantity_validation.md`

**When to Create**:

- Existing feature needs improvement
- Performance optimization needed
- User experience enhancement
- Code quality improvement

#### Bug Reports (`docs/development/cards/bugs/BUG_*.md`)

**Purpose**: Document defects that need to be fixed.

**Structure**:

- **Bug Summary**: Brief description
- **Context**: Feature context
- **The Bug**: Detailed description
- **How to Reproduce**: Step-by-step reproduction
- **Expected Behavior**: What should happen
- **Current Behavior**: What actually happens
- **How to Fix**: Fix approach (filled in when addressed)
- **Status**: Current status

**Example**: `BUG_report_duplicate_minifigs_in_sets.md`

**Completion**: When a bug report is fixed, rename it with "X_" prefix:
- `BUG_report_duplicate_minifigs.md` → `X_BUG_report_duplicate_minifigs.md`

**When to Create**:

- Defect is discovered
- Incorrect behavior is identified
- Data integrity issue found

### Card Lifecycle

1. **Creation**: Card is created with problem/requirement description
2. **Clarification**: Open questions are answered (for features)
3. **Specification**: SPECS document is created from the card
4. **Gameplan**: GAMEPLAN document is created from the SPECS
5. **Implementation**: Gameplan is followed to implement
6. **Completion**: 
   - Card status updated to COMPLETE in the card content
   - **Card file renamed with "X_" prefix** to visually indicate completion
   - Example: `FEATURE_navigation_menu.md` → `X_FEATURE_navigation_menu.md`
   - **Gameplan directory renamed with "X_" prefix** to visually indicate completion
   - Example: `docs/development/gameplans/event-system/` → `docs/development/gameplans/X_event-system/`

**Note**: Cards and gameplans use different completion markers:
- **Cards**: Rename the **file** with "X_" prefix (e.g., `FEATURE_name.md` → `X_FEATURE_name.md`)
- **Gameplans**: Rename the **directory** with "X_" prefix (e.g., `gameplans/event-system/` → `gameplans/X_event-system/`)

---

## Card to Specification Workflow

### Step 1: Card Creation

A card is created in the appropriate directory (`docs/development/cards/features/`, `docs/development/cards/enhancements/`, or `docs/development/cards/bugs/`) with:

- Problem statement
- Requirements or desired outcome
- Open questions (for features)
- Context and related information

### Step 2: Clarification (Features Only)

For feature cards, open questions are answered by the user. These answers are documented in the card under "Open Questions & Answers" section.

**Example Questions**:

- Data persistence approach
- Validation logic
- UI behavior
- API endpoint structure
- Relationship to existing features

### Step 3: Specification Creation

**Location**: `docs/development/specs/{feature-name}/{feature-name}_SPECS.md`

**Process**:

1. Read the card thoroughly
2. Extract all requirements and answers to questions
3. Create comprehensive specification document including:
   - Overview and problem statement
   - Solution description
   - Data model (if applicable)
   - API endpoints (if applicable)
   - UI requirements (if applicable)
   - Backend implementation details
   - Frontend implementation details
   - Testing requirements
   - Success criteria

**Structure**:

- Overview
- Problem Statement
- Solution
- Requirements (functional and non-functional)
- Data Model (if applicable)
- API Endpoints (if applicable)
- UI Requirements (if applicable)
- Implementation Details
- Testing Requirements
- Success Criteria
- Related Features

**Example**:

- Card: `docs/development/cards/features/FEATURE_navigation_menu.md`
- SPECS: `docs/development/specs/navigation-menu/navigation-menu_SPECS.md`

### Step 4: Gameplan Creation

**Location**: `docs/development/gameplans/{feature-name}/{feature-name}_GAMEPLAN.md`

**Process**:

1. Read the SPECS document
2. Break down implementation into logical phases
3. Create step-by-step gameplan with:
   - Phase overview and time estimates
   - Prerequisites
   - Step-by-step instructions
   - Code examples
   - Verification checklists
   - Progress tracking

**Structure**:

- Overview
- Progress Summary (phases with completion status)
- Prerequisites
- Phase 1: [Description] (~time estimate)
  - Step 1.1: [Action]
  - Step 1.2: [Action]
  - Verification checklist
- Phase 2: [Description] (~time estimate)
  - ...
- Completion Checklist

**Example**:

- SPECS: `docs/development/specs/reconciliation-session-management/reconciliation-session-management_SPECS.md`
- GAMEPLAN: `docs/development/gameplans/reconciliation-session-management/reconciliation-session-management_GAMEPLAN.md`

### Step 5: Card Update

Update the card to reference the created documents:

```markdown
## Documentation

- **SPECS**: `docs/development/specs/{feature-name}/{feature-name}_SPECS.md` ✅ Created
- **GAMEPLAN**: `docs/development/gameplans/{feature-name}/{feature-name}_GAMEPLAN.md` ✅ Created

## Status

- **Status**: 📋 READY FOR IMPLEMENTATION
```

---

## Gameplan Implementation Process

### Overview

Once a gameplan is created, implementation follows the gameplan phase by phase, with automatic git commits after each phase step and pausing for review.

### Process Flow

1. **Start Implementation**: Begin with Phase 1, Step 1.1
2. **Complete Step**: Implement the step according to gameplan instructions
3. **Run Tests**: Execute tests in non-interactive mode
4. **Verify**: Complete verification checklist for the step
5. **Git Commit**: Create commit with meaningful message
6. **Continue**: Move to next step in same phase
7. **Phase Complete**: After all steps in a phase are complete, pause for review
8. **Review**: User reviews completed phase
9. **Continue**: Proceed to next phase after approval

### Phase Step Completion

For each step in a gameplan phase:

#### 1. Implementation

- Follow the step instructions in the gameplan
- Implement code changes
- Add/update files as specified
- Follow code examples provided

#### 2. Verification

- Complete the verification checklist for the step:
  - [ ] Code implemented
  - [ ] Files created/modified
  - [ ] Functionality works
  - [ ] No errors

#### 3. Testing

**Before committing**, run tests in non-interactive mode:

```bash
npm test
```

**Requirements**:

- All tests must pass
- Tests run in non-interactive mode (no prompts)
- No test failures allowed
- If tests fail, fix issues before committing

**Test Command**: `npm test` (runs Vitest in non-interactive mode)

#### 4. Git Commit

After tests pass, create a git commit with a meaningful message:

**Commit Message Format**:

```
[Feature/Enhancement/Bug] Brief description

- Detailed change 1
- Detailed change 2
- Detailed change 3
```

**Examples**:

```
Feature: Add reconciliation session management API endpoints

- Added GET /reconciliation-sessions endpoint
- Added POST /reconciliation-sessions endpoint
- Added session creation handler function
- Added session loading function
- All tests passing
```

```
Enhancement: Add quantity validation for minifig assignments

- Added backend validation in POST /assign route
- Added frontend checkbox limiting in minifig.ejs
- Added quantity display on assignment page
- Added comprehensive test coverage
- All tests passing
```

**Commit Process**:

```bash
# Stage all changes
git add -A

# Create commit with meaningful message
git commit -m "Feature: Add reconciliation session management API endpoints

- Added GET /reconciliation-sessions endpoint
- Added POST /reconciliation-sessions endpoint
- Added session creation handler function
- Added session loading function
- All tests passing"
```

#### 5. Continue to Next Step

Move to the next step in the same phase and repeat the process.

### Phase Completion

After all steps in a phase are complete:

1. **Update Gameplan**: Mark phase as COMPLETE in gameplan progress summary
2. **Final Verification**: Ensure all phase verification items are complete
3. **Final Commit**: Create final commit for the phase (if needed)
4. **Pause for Review**: Stop and wait for user review

**Example Phase Completion**:

```markdown
## Progress Summary

- ✅ **Phase 1: Database Schema Setup** - COMPLETE
- ⏳ **Phase 2: Backend Core Functions** - IN PROGRESS
```

### Review Process

After each phase completion:

1. **User Reviews**:
   - Code changes
   - Test results
   - Implementation approach
   - Any issues or concerns

2. **Feedback**:
   - User provides feedback or approval
   - Any requested changes are made
   - Additional commits created if needed

3. **Continue**:
   - After approval, proceed to next phase
   - Or address any requested changes first

### Handling Anomalies

If issues arise during implementation:

1. **Pause Implementation**: Stop current work
2. **Document Issue**: Note what went wrong
3. **Ask for Feedback**: Request user input on how to proceed
4. **Wait for Response**: Do not proceed until user provides guidance
5. **Resolve Issue**: Fix the problem based on feedback
6. **Continue**: Resume implementation after resolution

**Example Anomaly Handling**:

- Test failures that can't be resolved
- Unexpected behavior
- Missing information in specs
- Conflicting requirements
- Database schema issues

---

## Git Commit Workflow

### Commit Frequency

**Rule**: Create commits after completing each phase step, not after every file change.

**Rationale**:

- Each step represents a logical unit of work
- Commits are meaningful and reviewable
- Easier to track progress through gameplan
- Better git history

### Commit Message Guidelines

#### Structure

```
[Type] Brief summary (50-72 characters)

- Detailed change 1
- Detailed change 2
- Detailed change 3

Optional: Additional context or notes
```

#### Type Prefixes

- **Feature**: New feature implementation
- **Enhancement**: Improvement to existing feature
- **Bug**: Bug fix
- **Refactor**: Code refactoring
- **Test**: Test additions or updates
- **Docs**: Documentation updates

#### Examples

**Feature Commit**:

```
Feature: Add reconciliation session management API endpoints

- Added GET /reconciliation-sessions endpoint
- Added POST /reconciliation-sessions endpoint
- Added session creation handler function
- Added session loading function
- Registered routes in startServer() and createApp()
- All tests passing
```

**Enhancement Commit**:

```
Enhancement: Add quantity validation for minifig assignments

- Added backend validation in POST /assign route
- Added frontend checkbox limiting in minifig.ejs
- Added quantity display on assignment page
- Added comprehensive test coverage (10 new test cases)
- All tests passing
```

**Bug Fix Commit**:

```
Bug: Fix duplicate minifigs in set report

- Fixed deduplication logic in first-run.js
- Added deduplicateMinifigs() function
- Applied deduplication to official and virtual minifigs
- Updated test fixtures
- All tests passing
```

### Commit Process

1. **Stage Changes**:

   ```bash
   git add -A
   ```

2. **Verify Tests Pass**:

   ```bash
   npm test
   ```

3. **Create Commit**:

   ```bash
   git commit -m "Feature: Add reconciliation session management API endpoints

   - Added GET /reconciliation-sessions endpoint
   - Added POST /reconciliation-sessions endpoint
   - Added session creation handler function
   - Added session loading function
   - All tests passing"
   ```

4. **Verify Commit**:
   ```bash
   git log -1
   ```

---

## Testing Requirements

### Test Execution

**Rule**: Tests must be run in non-interactive mode before every git commit.

### Test Command

```bash
npm test
```

This runs Vitest in non-interactive mode with:

- No prompts
- Automatic test execution
- Clear pass/fail output
- Exit code 0 on success, non-zero on failure

### Test Requirements

1. **All Tests Must Pass**: No test failures allowed before commit
2. **Non-Interactive Mode**: Tests must run without user interaction
3. **Fast Execution**: Tests should complete quickly (< 30 seconds typically)
4. **Clear Output**: Test results should be clearly visible

### Handling Test Failures

If tests fail:

1. **Do Not Commit**: Never commit with failing tests
2. **Investigate**: Determine cause of failure
3. **Fix Issues**: Resolve test failures
4. **Re-run Tests**: Verify all tests pass
5. **Then Commit**: Only commit after all tests pass

### Test Coverage Expectations

- **New Features**: Add tests for new functionality
- **Enhancements**: Add tests for enhanced functionality
- **Bug Fixes**: Add tests to prevent regression
- **API Endpoints**: Comprehensive endpoint tests
- **Core Functions**: Unit tests for business logic

---

## Review Process

### Phase Review

After each phase completion:

1. **Implementation Complete**: All phase steps completed
2. **Tests Passing**: All tests pass
3. **Git Committed**: Changes committed with meaningful message
4. **Pause**: Wait for user review
5. **User Reviews**: User examines:
   - Code changes
   - Test results
   - Implementation approach
   - Gameplan progress
6. **Feedback**: User provides:
   - Approval to continue
   - Requested changes
   - Questions or concerns
7. **Address Feedback**: Make any requested changes
8. **Continue**: Proceed to next phase after approval

### Review Checklist

User reviews:

- [ ] Code changes are correct
- [ ] Implementation matches specs
- [ ] Tests are comprehensive
- [ ] No regressions introduced
- [ ] Code quality is acceptable
- [ ] Documentation is updated (if needed)
- [ ] Gameplan progress is accurate

### Communication

During review:

- User may request changes
- User may ask questions
- User may approve to continue
- User may request additional testing
- User may identify issues

**Important**: Do not proceed to next phase until user explicitly approves or requests continuation.

---

## Workflow Summary

### Complete Development Workflow

1. **Initial Setup** (One-time):
   - Follow `SPECS.md` and `GAMEPLAN.md` to build initial application
   - Complete all phases
   - Application is functional

2. **Card Creation**:
   - Create feature/enhancement/bug card
   - Document problem and requirements
   - Answer open questions (for features)

3. **Specification**:
   - Create SPECS document from card
   - Document all requirements in detail
   - Include implementation details

4. **Gameplan**:
   - Create GAMEPLAN document from SPECS
   - Break into phases and steps
   - Include time estimates

5. **Implementation** (Per Phase):
   - Complete each step in phase
   - Run tests (non-interactive)
   - Verify step completion
   - Create git commit
   - Continue to next step

6. **Phase Completion**:
   - Mark phase complete in gameplan
   - Final commit (if needed)
   - Pause for review

7. **Review**:
   - User reviews phase
   - Address feedback
   - Get approval

8. **Continue**:
   - Proceed to next phase
   - Repeat until all phases complete

9. **Feature Complete**:
   - Update card status to COMPLETE in card content
   - **Rename card file with "X_" prefix** (e.g., `FEATURE_name.md` → `X_FEATURE_name.md`)
   - **Rename gameplan directory with "X_" prefix** (e.g., `gameplans/event-system/` → `gameplans/X_event-system/`)
   - Update gameplan progress to mark all phases complete
   - Final documentation update

**Completion Markers**:
- **Cards**: File renamed with "X_" prefix (e.g., `FEATURE_name.md` → `X_FEATURE_name.md`)
- **Gameplans**: Directory renamed with "X_" prefix (e.g., `gameplans/event-system/` → `gameplans/X_event-system/`)

---

## Best Practices

### Card Management

- **One card per feature/enhancement/bug**: Keep cards focused
- **Clear problem statements**: Describe the problem clearly
- **Answer all questions**: For features, answer open questions before creating SPECS
- **Update status**: Keep card status current

### Specification Quality

- **Comprehensive**: Include all requirements
- **Detailed**: Provide enough detail for implementation
- **Clear**: Use clear language and examples
- **Complete**: Include all aspects (data model, API, UI, testing)

### Gameplan Quality

- **Logical phases**: Break work into logical phases
- **Clear steps**: Each step should be actionable
- **Time estimates**: Provide realistic time estimates
- **Verification**: Include verification checklists
- **Code examples**: Provide code examples where helpful

### Implementation Quality

- **Follow gameplan**: Implement according to gameplan steps
- **Test thoroughly**: Add tests for new functionality
- **Meaningful commits**: Create commits with clear messages
- **No regressions**: Ensure existing functionality still works
- **Code quality**: Follow existing code patterns

### Testing Quality

- **Comprehensive coverage**: Test all new functionality
- **Edge cases**: Test edge cases and error conditions
- **Integration tests**: Test integration with existing features
- **Non-interactive**: All tests must run without prompts

---

## Examples

### Example: Feature Development

1. **Card Created**: `docs/development/cards/features/FEATURE_navigation_menu.md`
   - Problem: No navigation between pages
   - Requirements: Navigation menu on all pages
   - Open questions: Structure, placement, mobile behavior

2. **Questions Answered**: User provides answers to all questions

3. **SPECS Created**: `docs/development/specs/navigation-menu/navigation-menu_SPECS.md`
   - Detailed requirements
   - UI specifications
   - Implementation details

4. **GAMEPLAN Created**: `docs/development/gameplans/navigation-menu/navigation-menu_GAMEPLAN.md`
   - Phase 1: Create navigation partial
   - Phase 2: Add to all pages
   - Phase 3: Styling
   - Phase 4: Mobile responsiveness
   - Phase 5: Testing

5. **Implementation**:
   - Phase 1, Step 1.1: Create navigation.ejs partial
     - Implement
     - Test
     - Commit: "Feature: Create navigation menu partial"
   - Phase 1, Step 1.2: Add basic HTML structure
     - Implement
     - Test
     - Commit: "Feature: Add navigation menu HTML structure"
   - Phase 1 complete → Pause for review
   - User approves → Continue to Phase 2
   - ... (repeat for all phases)

6. **Feature Complete**: 
   - Card status updated to COMPLETE in card content
   - Card file renamed: `FEATURE_navigation_menu.md` → `X_FEATURE_navigation_menu.md`
   - Gameplan directory renamed: `gameplans/navigation-menu/` → `gameplans/X_navigation-menu/`

### Example: Enhancement Development

1. **Card Created**: `docs/development/cards/enhancements/ENHANCE_quantity_validation.md`
   - Problem: No validation prevents over-assignment
   - Requirements: Frontend and backend validation

2. **SPECS Created**: `docs/development/specs/quantity-validation/quantity-validation_SPECS.md`
   - Validation requirements
   - Implementation approach

3. **GAMEPLAN Created**: `docs/development/gameplans/quantity-validation/quantity-validation_GAMEPLAN.md`
   - Phase 1: Backend validation
   - Phase 2: Frontend validation
   - Phase 3: Testing

4. **Implementation**: Follow gameplan with commits after each step

5. **Enhancement Complete**: 
   - Card status updated to COMPLETE in card content
   - Card file renamed: `ENHANCE_quantity_validation.md` → `X_ENHANCE_quantity_validation.md`
   - Gameplan directory renamed: `gameplans/quantity-validation/` → `gameplans/X_quantity-validation/`

### Example: Bug Fix

1. **Bug Reported**: `docs/development/cards/bugs/BUG_report_duplicate_minifigs_in_sets.md`
   - Problem: Duplicate minifigs in set report
   - Reproduction steps
   - Expected vs. current behavior

2. **SPECS Created**: `docs/development/specs/bug-fix-duplicate-minifigs/bug-fix-duplicate-minifigs_SPECS.md`
   - Root cause analysis
   - Fix approach

3. **GAMEPLAN Created**: `docs/development/gameplans/bug-fix-duplicate-minifigs/bug-fix-duplicate-minifigs_GAMEPLAN.md`
   - Phase 1: Fix deduplication in first-run.js
   - Phase 2: Update report generation
   - Phase 3: Testing

4. **Implementation**: Follow gameplan with commits after each step

5. **Bug Fixed**: 
   - Card status updated to COMPLETE in card content
   - Card file renamed: `BUG_report_duplicate_minifigs.md` → `X_BUG_report_duplicate_minifigs.md`
   - Gameplan directory renamed: `gameplans/bug-fix-duplicate-minifigs/` → `gameplans/X_bug-fix-duplicate-minifigs/`

---

## Tools and Commands

### Development Commands

```bash
# Run tests (non-interactive)
npm test

# Format code
npm run format

# Start development server
npm start

# Load database
npm run load-db

# Generate PAYLOAD_A
npm run first-run

# Generate report
npm run generate-report
```

### Git Commands

```bash
# Stage all changes
git add -A

# Create commit
git commit -m "Type: Description

- Change 1
- Change 2"

# View recent commits
git log --oneline -10

# View changes
git diff
```

### Verification Commands

```bash
# Check test coverage
npm test -- --coverage

# Lint code
npm run lint  # (if configured)

# Check database
sqlite3 ./data/rebrickable.db ".tables"
```

---

## Conclusion

This development process provides:

- **Structure**: Clear workflow from card to implementation
- **Documentation**: Comprehensive specs and gameplans
- **Quality**: Testing and review at each phase
- **Traceability**: Git commits track progress
- **Collaboration**: Review process ensures alignment

By following this process, the project maintains:

- High code quality
- Comprehensive test coverage
- Clear documentation
- Meaningful git history
- Consistent implementation patterns

---

**End of Document**
