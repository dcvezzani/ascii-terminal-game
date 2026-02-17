# Enhancement Card: Docker Image, docker-compose, and Container Resources

## Status

- **Status**: NOT STARTED
- **Priority**: LOW (developer tooling; supports develop, test, build, distribute)
- **Created**: 2026-02-16

## Context

**Current State**:
- The project has no Docker image or docker-compose setup. Development, testing, build, and distribution are done on the host (clone repo, Node, npm scripts).
- **Build-distribution spec** (`docs/development/specs/build-distribution/build-distribution_SPECS.md`) defines Docker as an optional distribution option: image name **`ascii-tag`**, base image a **lite version of Ubuntu**, main purpose **development and testing**; all resources (client, server, boards) in the image. Exact Dockerfile and run instructions were left to a later card or README.

**Location**:
- Deliverables: project root or a dedicated directory (e.g. `docker/`) for Dockerfile, docker-compose.yml, and any supporting files (e.g. .dockerignore, run scripts).

## Problem

- Developers who prefer containerized workflows cannot run the app in Docker. There is no single-command way to bring up the server (or client+server) in a container for development or testing. Build and distribution pipelines (e.g. CI) may benefit from a reproducible container environment.

## Desired Outcome

Create **Docker image**, **docker-compose.yml**, and any other container-related resources so the application can be used for:

1. **Develop** – Run the app (client and/or server) inside containers; mount source for live editing if useful.
2. **Test** – Run tests (e.g. unit, integration) in a container for consistency and CI.
3. **Build** – Optionally build the application or artifacts (e.g. npm pack, future standalone binaries) inside a container.
4. **Distribute** – Provide the **`ascii-tag`** image (per build-distribution spec) with all resources (client, server, boards) for those who want to run via Docker.

Requirements and scope (single Dockerfile vs. multi-stage, compose services for server vs. client, etc.) to be refined in a gameplan or during implementation.

## Requirements

- **Image name:** **`ascii-tag`** (per build-distribution spec).
- **Base image:** Use a **lite version of Ubuntu** (e.g. `ubuntu:24.04` or a minimal variant) per spec.
- **Contents:** Image should include **all resources** needed for client, server, and boards (per spec); exact layout and entry points to be defined in implementation.
- **docker-compose.yml:** Define services that support at least development and testing workflows (e.g. server service, optional client or test runner); document how to run.
- **Documentation:** Document how to build the image, run with docker and docker-compose, and use for develop/test/build/distribute (in README or a dedicated doc).

## Dependencies

- **docs/development/specs/build-distribution/build-distribution_SPECS.md**: Source for image name, base image, and Docker scope. No code dependency on other cards.

## Documentation

- **README / wiki:** Add a section or link describing Docker usage (build, run, compose, use cases).
- **GAMEPLAN:** Optional; create when ready to implement.

## Related Cards

- **FEATURE_build_distribution_and_terminal_compatibility**: Parent distribution decisions.
- **ENHANCEMENT_create_distribution_spec**: Produced the build-distribution spec (Docker subsection).
- **ENHANCEMENT_ci_setup_github_actions**: CI may use the same image or Dockerfile for test/build.

## Tags

- `enhancement`
- `docker`
- `docker-compose`
- `development`
- `testing`
- `distribution`
