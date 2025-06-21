# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Diopside** is a serverless web application for archiving and browsing VTuber (Shirayuki Tomoe) video content. The architecture consists of:

- **Frontend**: Next.js 15 (TypeScript) with Hero UI components served via S3/CloudFront
- **Backend**: FastAPI on AWS Lambda with DynamoDB storage
- **Infrastructure**: AWS CDK for Infrastructure as Code

## Development Commands

### Task Runner (Primary)
This project uses Task (Taskfile.yaml) as the primary build tool:

```bash
# Infrastructure
task bootstrap              # Bootstrap CDK environment
task deploy                # Deploy infrastructure only
task deploy-all            # Deploy everything (infra + frontend)
task diff                  # Show CDK infrastructure diff
task synth                 # Synthesize CDK templates
task destroy               # Destroy infrastructure

# Development & Testing
task lint                  # Run infrastructure linting (ruff + mypy)
task test                  # Run infrastructure tests
task backend:lint          # Run backend linting
task backend:test          # Run backend tests
task backend:dev           # Run backend development server
task frontend:install      # Install frontend dependencies
task frontend:dev          # Run frontend development server (port 50970)
task frontend:build        # Build frontend for production
task frontend:test         # Run frontend tests

# Utilities
task clean                 # Clean build artifacts
task install-deps         # Install Lambda layer dependencies
```

### Moon Task Runner (Alternative)
The project also supports Moon task runner:

```bash
moon run web:build         # Build frontend
moon run :deploy           # Deploy infrastructure + frontend
moon run :diff             # Show deployment diff
moon run :put              # Import data to DynamoDB
```

### Direct Commands

Frontend (package/web/):
```bash
npm run dev                # Development server
npm run build              # Production build
npm run test               # Jest unit tests
npm run test:e2e           # Playwright E2E tests
npm run test:e2e:ui        # Playwright with UI
npm run lint               # ESLint
```

Backend (package/api/):
```bash
uv run python main.py      # Development server
uv run pytest tests/      # Run tests
uv run ruff check .        # Linting
uv run mypy app/           # Type checking
```

Infrastructure:
```bash
uv run cdk diff            # Show changes
uv run cdk deploy --all    # Deploy all stacks
uv run pytest tests/      # Run infrastructure tests
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

- **Unit Tests**: Jest for frontend components, pytest for backend logic
- **E2E Tests**: Playwright for user workflows
- **Integration Tests**: API endpoint testing with real DynamoDB
- **Infrastructure Tests**: CDK snapshot testing

## Deployment Notes

- Use `task deploy-all` for complete deployment (infrastructure + frontend sync)
- Frontend builds to `package/web/out/` and syncs to S3
- CloudFront invalidation is triggered automatically
- Environment variables are set via CDK context
- The stack name is "ShirayukiTomoFansiteStack" in all environments

## Data Import

Use `task put` or `moon run :put` to import video metadata from JSON files into DynamoDB. The import script is located at `package/scripts/src/import_json_to_dynamodb.py`.

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

Based on standard project documentation practices, these documents **must be maintained**:

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
- When the document should be updated
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