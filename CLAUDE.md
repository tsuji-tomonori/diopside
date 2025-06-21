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

The project uses a hierarchical documentation structure:

```
docs/
├── README.md                     # Project overview (Japanese)
├── design-specification.md       # Comprehensive design document
├── architecture.md              # Technical architecture details
├── deployment.md                # Deployment procedures
├── contributing.md              # Development guidelines
├── cross-stack-deployment.md    # Cross-region deployment notes
├── IMPLEMENTATION_SUMMARY.md    # Feature implementation history
├── BUGFIX_SUMMARY.md           # Bug fix history
├── REFACTOR_SUMMARY.md         # Refactoring history
├── CROSS_REGION_FIX_SUMMARY.md # Cross-region fix documentation
├── FONT_PRELOAD_FIX_SUMMARY.md # Font optimization fixes
└── LAMBDA_LAYER_FIX_SUMMARY.md # Lambda layer optimization fixes
```

### Documentation Maintenance Schedule

**When making changes, update these documents:**

#### Code Changes
- **When adding new features**: Update `design-specification.md` (§3-4), `architecture.md` (API section), `README.md` (usage)
- **When changing API**: Update `design-specification.md` (§4), `architecture.md` (§4), and API docs in FastAPI code
- **When modifying infrastructure**: Update `architecture.md` (§2), `deployment.md` (§3-4), `design-specification.md` (§2)
- **When changing build/deploy process**: Update `deployment.md`, this CLAUDE.md (commands section), Taskfile.yaml comments

#### Bug Fixes
- **After fixing critical bugs**: Add entry to `BUGFIX_SUMMARY.md` with problem description, solution, and prevention measures
- **When fixing performance issues**: Update `design-specification.md` (§7), `architecture.md` (performance sections)

#### Refactoring
- **After major refactoring**: Update `REFACTOR_SUMMARY.md`, review all architecture documents for accuracy
- **When changing project structure**: Update this CLAUDE.md (Directory Structure section), README.md

#### Infrastructure Changes
- **AWS resource changes**: Update `architecture.md` (§3, §5), `deployment.md` (§3-4), `design-specification.md` (§6)
- **Security updates**: Update `architecture.md` (§4), `design-specification.md` (§6)
- **Cross-region/multi-stack changes**: Update `cross-stack-deployment.md`

### Documentation Quality Standards

1. **Japanese Documentation**: Use formal Japanese for user-facing docs (README.md, design-specification.md)
2. **Technical Documentation**: Use English for technical details (this CLAUDE.md, code comments)
3. **Code Examples**: Always test code examples before committing
4. **Version Alignment**: Update version numbers and dependencies when they change
5. **Broken Links**: Check internal links when restructuring documents

### Auto-Update Triggers

**Always update simultaneously:**
- Package.json changes → Update dependency versions in architecture.md, README.md
- New API endpoints → Update design-specification.md §4, architecture.md API section
- CDK stack changes → Update deployment.md, architecture.md infrastructure sections
- New environment variables → Update deployment.md environment section

### Review Schedule

**Monthly Review**: Check accuracy of architecture.md, design-specification.md against actual implementation
**Release Review**: Update all version references, verify all links work, check command examples
**Quarterly Review**: Review documentation structure effectiveness, consolidate or split documents as needed