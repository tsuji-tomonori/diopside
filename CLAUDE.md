# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## RFC Key Words
The terms "MUST", "SHOULD", "MAY", "MUST NOT", and "SHOULD NOT" are used as defined in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

## Project Overview

**Diopside** is a serverless web application for archiving and browsing VTuber (Shirayuki Tomoe) video content. The architecture consists of:

- **Frontend**: Next.js 15 (TypeScript) with Hero UI components served via S3/CloudFront
- **Backend**: FastAPI on AWS Lambda with DynamoDB storage
- **Infrastructure**: AWS CDK for Infrastructure as Code

## Development Commands

### Moon Task Runner
This repository uses Moon for all workflows. Contributors **SHOULD** rely on these tasks:

```bash
moon :check        # Run lint, type checking, and tests
moon root:deploy   # Deploy infrastructure and application
moon run api:dev   # Start the backend development server
moon run web:dev   # Start the frontend development server
```

## Architecture Overview

### Directory Structure
```
package/
├── api/                   # FastAPI backend
│   ├── app/
│   │   ├── main.py       # FastAPI application entry
│   │   ├── models/       # Pydantic models (Video, TagNode)
│   │   ├── routers/      # API route handlers
│   │   └── services/     # Business logic (DynamoDBService)
│   └── tests/
├── infra/                # AWS CDK infrastructure
│   ├── app.py           # CDK app entry point
│   ├── src/
│   │   ├── construct/   # Reusable CDK constructs
│   │   ├── model/       # Environment and project models
│   │   └── stack/       # CDK stack definitions
│   └── tests/
├── scripts/             # Utility scripts
│   └── src/
│       └── import_json_to_dynamodb.py  # Data import script
└── web/                 # Next.js frontend
    ├── src/
    │   ├── app/         # Next.js App Router pages
    │   ├── components/  # React components
    │   ├── contexts/    # React contexts (ConfigContext)
    │   ├── hooks/       # Custom hooks (useApi)
    │   ├── lib/         # Utilities (api client, config)
    │   └── types/       # TypeScript type definitions
    └── tests/
```

### Key Components

**Backend API (FastAPI + Lambda)**:
- `/api/videos` - Get videos by year with pagination
- `/api/videos/by-tag` - Filter videos by hierarchical tags
- `/api/videos/random` - Get random videos
- `/api/videos/memory` - Get thumbnails for memory game
- `/api/tags` - Get hierarchical tag tree

**Frontend (Next.js)**:
- `/` - Main video grid with year/tag filtering
- `/memory` - Memory card game using video thumbnails
- `/random` - Random video discovery
- `/tags` - Hierarchical tag navigation

**Infrastructure (CDK)**:
- Unified AppStack containing both frontend and backend resources
- DynamoDB table with GSI for year-based queries
- S3 + CloudFront for static site hosting
- API Gateway + Lambda for backend
- WAF for security

### Data Flow

1. **Video Data**: Stored in DynamoDB with video_id as primary key
2. **Tag Hierarchy**: Built dynamically from video tags (e.g., "ゲーム実況/ホラー/Cry of Fear")
3. **Frontend State**: Managed with SWR for server state + React Context for app config
4. **API Integration**: Axios client with TypeScript interfaces

### Development Patterns

**Backend**:
- FastAPI with async/await pattern
- Pydantic models for request/response validation
- DynamoDB service layer with error handling
- AWS Lambda Powertools for logging and tracing

**Frontend**:
- Server-side rendering with Next.js App Router
- Hero UI component library with Tailwind CSS
- SWR for data fetching and caching
- TypeScript strict mode with comprehensive type definitions

**Infrastructure**:
- CDK constructs for reusable infrastructure patterns
- Environment-specific configuration (Dev/Prod)
- Cross-stack resource sharing via direct references
- Automated tagging for resource management

## Testing Strategy

- **Unit Tests**: Jest for frontend components and pytest for backend logic. Unit tests **MUST NOT** access external resources; use mocks for network, file system, and database interactions.
- **E2E Tests**: Playwright for user workflows
- **Integration Tests**: API endpoint testing with real DynamoDB
- **Infrastructure Tests**: CDK snapshot testing

## Deployment Notes

- Use `moon root:deploy` for complete deployment (infrastructure + frontend sync to S3)
- Frontend builds to `package/web/out/` and syncs to S3 automatically
- CloudFront invalidation is triggered automatically during deployment
- Environment variables are set via CDK context
- The stack name is "ShirayukiTomoFansiteStack" in all environments

## Data Import

Use `moon run :import-data` to import video metadata from JSON files into DynamoDB. The import script is located at `package/scripts/src/import_json_to_dynamodb.py`.

## Documentation Management

### Documentation Structure

The project uses a categorized documentation structure:

```
docs/
├── README.md                          # Main project overview
├── design/                           # Design & Architecture Documents
│   ├── design-specification.md       # Comprehensive design document
│   ├── architecture.md              # Technical architecture details
│   └── api-reference.md             # Detailed API specification
├── development/                      # Development Guidelines
│   ├── contributing.md              # Development workflow & standards
│   └── testing-guide.md             # Testing strategy & procedures
├── operations/                       # Operations & Maintenance
│   ├── deployment.md                # Deployment procedures
│   ├── monitoring.md                # Monitoring & observability
│   └── troubleshooting.md           # Common issues & solutions
└── user-docs/                       # User-Facing Documentation
    └── installation.md              # Local setup instructions
```

**Root Level Documents:**
- `LICENSE` - MIT License
- `SECURITY.md` - Security policy & vulnerability reporting
- `CLAUDE.md` - This file (Claude Code guidance)

### Documentation Categories

1. **Design Documents** (`docs/design/`): Architecture, specifications, and API documentation
2. **Development** (`docs/development/`): Guidelines for contributors and developers
3. **Operations** (`docs/operations/`): Deployment, monitoring, and troubleshooting
4. **User Documentation** (`docs/user-docs/`): Installation and usage guides

### Required Documents

Based on standard project documentation practices, these documents **MUST be maintained**:

#### Core Project Documents
- `README.md` - Project overview, quick start, basic usage
- `LICENSE` - Legal license terms
- `SECURITY.md` - Security policy for vulnerability reporting

#### Design Documents (**Write to CLAUDE.md when creating/updating**)
- `docs/design/design-specification.md` - Comprehensive design document
- `docs/design/architecture.md` - Technical architecture and system design
- `docs/design/api-reference.md` - Complete API specification

#### Development Documents (**Write to CLAUDE.md when creating/updating**)
- `docs/development/contributing.md` - Development workflow, coding standards
- `docs/development/testing-guide.md` - Testing strategy, procedures, examples

#### Operations Documents (**Write to CLAUDE.md when creating/updating**)
- `docs/operations/deployment.md` - Production deployment procedures
- `docs/operations/monitoring.md` - Monitoring, logging, alerting setup
- `docs/operations/troubleshooting.md` - Common issues and solutions

#### User Documents (**Write to CLAUDE.md when creating/updating**)
- `docs/user-docs/installation.md` - Local development setup

### Documentation Maintenance Schedule

**When making changes, update these documents:**

#### Code Changes
- **API changes**: Update `docs/design/api-reference.md`, `docs/design/architecture.md` (§4)
- **New features**: Update `docs/design/design-specification.md` (§3-4), `README.md` (usage)
- **Infrastructure changes**: Update `docs/design/architecture.md` (§2), `docs/operations/deployment.md`
- **Build/deploy changes**: Update `docs/operations/deployment.md`, this CLAUDE.md (commands)

#### Development Process Changes
- **Testing procedures**: Update `docs/development/testing-guide.md`
- **Coding standards**: Update `docs/development/contributing.md`
- **Local setup changes**: Update `docs/user-docs/installation.md`

#### Operations Changes
- **Monitoring setup**: Update `docs/operations/monitoring.md`
- **New troubleshooting solutions**: Update `docs/operations/troubleshooting.md`
- **Deployment procedures**: Update `docs/operations/deployment.md`

### Documentation Quality Standards

1. **Language Usage**:
   - **Japanese**: User-facing docs (README.md, design-specification.md)
   - **English**: Technical docs (CLAUDE.md, API docs, code comments)

2. **Code Examples**: Always test examples before committing

3. **Version Alignment**: Update version numbers when dependencies change

4. **Links**: Verify internal links when restructuring

### Document Creation Guidelines

**When creating new documents, add guidance to CLAUDE.md for:**
- When the document **SHOULD** be updated
- What sections need maintenance
- Dependencies with other documents
- Quality standards specific to that document type

### Auto-Update Triggers

**Simultaneous updates required:**
- `package.json` changes → Update versions in `docs/design/architecture.md`, `README.md`
- New API endpoints → Update `docs/design/api-reference.md`, `docs/design/architecture.md`
- CDK changes → Update `docs/operations/deployment.md`, `docs/design/architecture.md`
- Environment variables → Update `docs/operations/deployment.md`, `docs/user-docs/installation.md`

### Review Schedule

- **Monthly**: Verify accuracy of design documents against implementation
- **Release**: Update all version references, verify links, test command examples
- **Quarterly**: Review documentation structure effectiveness, consolidate or reorganize as needed

### Missing Standard Documents

Documents commonly found in projects but **not currently needed**:
- `CHANGELOG.md` - Use GitHub releases instead
- `CODE_OF_CONDUCT.md` - Not needed for personal project
- `SUPPORT.md` - Information included in README.md
- API client SDKs - Auto-generated from FastAPI OpenAPI spec

## Important Notes

### Task Migration to Moon
This project has been **fully migrated from Task to Moon**. The previous `Taskfile.yaml` has been removed.

**Key changes:**
- All `task` commands replaced with `moon run` commands
- Monorepo structure with individual `moon.yml` files in each package
- Improved dependency management and caching via Moon
- Better cross-project dependency handling

**Do not** create or reference `Taskfile.yaml` - use Moon configurations only.

### Moon Project Structure
```
moon.yml                    # Root project with integration tasks
package/api/moon.yml         # Backend API tasks
package/web/moon.yml         # Frontend tasks
package/infra/moon.yml       # Infrastructure tasks
package/scripts/moon.yml     # Utility scripts
```

All documentation has been updated to reflect Moon usage. When adding new tasks or commands, use Moon syntax and update this guidance accordingly.

## Package Structure and Naming

All source code is located under the `package/` directory. Each subdirectory represents a project:

- `api/` – FastAPI backend
- `web/` – Next.js frontend
- `infra/` – AWS CDK infrastructure
- `scripts/` – Utility scripts

Package names use lower-case with hyphens. Python files use `snake_case` and TypeScript files use `kebab-case`. See [docs/development/coding-standards.md](docs/development/coding-standards.md) for detailed naming rules.

## Execution Commands

- `moon :check` – run lint, type checking, and tests for all packages
- `moon root:deploy` – deploy infrastructure and application from the root project

## Application Implementation Rules

- Backend code **MUST** follow asynchronous FastAPI patterns.
- Pydantic models **SHOULD** define request and response schemas.
- Tests **MUST** be provided for new API endpoints.
- Code style **MUST** comply with Ruff and mypy settings.

## Frontend Implementation Rules

- React components **SHOULD** be written in TypeScript.
- Components **MUST** reside under `web/src/components` and use PascalCase file names.
- Data fetching **SHOULD** use the provided `useApi` hook and SWR.
- UI components **MUST NOT** include business logic.

## Infrastructure Implementation Rules

- CDK stacks **MUST** be defined under `infra/src/stack`.
- Constructs **SHOULD** be reusable across stacks.
- IAM policies **MUST** grant least privilege only.
- Environment configuration **MUST NOT** be hard coded.

## Pull Request Rules

Pull requests **MUST** follow the checklist in [docs/development/review-checklist.md](docs/development/review-checklist.md) and use the template in `.github/pull_request_template.md`.

## Implementation Flow

1. Update the local `main` branch and create a feature branch named `claude/YYYYMMDD/short-description`.
2. Determine whether existing documents require updates or new documents are needed. Obtain approval before creating new documents.
3. Commit the documentation changes.
4. Write tests that describe the requirement and commit them.
5. Run `moon :check` and verify that the new tests fail; save the result output to a file.
6. Implement the requirement.
7. Run `moon :check` until all tests pass and fix issues as needed.
8. Commit the implementation.
9. Open a pull request and report the results.
