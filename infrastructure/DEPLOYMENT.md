# Deployment Guide

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Node.js** and **npm** for CDK CLI
3. **Python 3.12+** and **uv** for dependency management
4. **Task** for running deployment tasks

## Installation

### Install Task (if not already installed)
```bash
./install-task.sh
```

### Install CDK CLI
```bash
npm install -g aws-cdk
```

### Install Python dependencies
```bash
# Backend dependencies
cd backend && uv sync

# Infrastructure dependencies  
cd infrastructure && uv sync
```

## Bootstrap (First Time Setup)

Bootstrap both regions for cross-region references:
```bash
task bootstrap
```

## Deployment

### Full Deployment
Deploy all stacks (WAF + Main):
```bash
task deploy
```

### Step-by-Step Deployment (Recommended)

1. **Deploy WAF Stack first** (us-east-1):
   ```bash
   task deploy-waf
   ```

2. **Verify SSM Parameter** (optional):
   ```bash
   task check-ssm
   ```

3. **Deploy Main Stack** (ap-northeast-1):
   ```bash
   task deploy-main
   ```

## Development Tasks

### Check Changes
```bash
task diff
```

### Synthesize Templates
```bash
task synth
```

### Clean Build Artifacts
```bash
task clean
```

### Run Tests and Linting
```bash
# Infrastructure
task lint
task test

# Backend
task backend:lint
task backend:test
```

### Run Backend Development Server
```bash
task backend:dev
```

## Architecture

### Lambda Layers
- **Dependencies Layer**: Contains FastAPI, Pydantic, Mangum, and other Python dependencies (from backend/pyproject.toml)
- **AWS Powertools Layer**: AWS-managed layer for observability and utilities

### Cross-Region Setup
- **WAF Stack** (us-east-1): Creates WebACL for CloudFront
- **Main Stack** (ap-northeast-1): Creates Lambda, API Gateway, S3, DynamoDB, CloudFront

### Key Features
- ✅ Lambda layers to reduce deployment size
- ✅ Cross-region references with SSM parameters
- ✅ AWS Powertools for observability
- ✅ Automated dependency management from backend uv configuration
- ✅ Infrastructure as Code with CDK
- ✅ Centralized task management with Taskfile

## Dependency Management

Dependencies are managed through the backend's `pyproject.toml` file:
- Production dependencies are automatically extracted using `uv export`
- Lambda layers are built from these dependencies
- No separate requirements.txt file needed for infrastructure

## Troubleshooting

### Lambda Size Issues
If you encounter "Unzipped size must be smaller than 262144000 bytes" error:
1. Ensure dependencies are in layers: `task install-deps`
2. Check that `infrastructure/.layers/` directory exists and contains dependencies
3. Verify Lambda function uses layers instead of bundled dependencies

### Cross-Region Reference Issues
If you get "Unable to fetch parameters" error:
1. Ensure bootstrap is up to date: `task bootstrap`
2. Deploy WAF stack first: `task deploy-waf`
3. Verify SSM parameter exists: `task check-ssm`
4. Then deploy main stack: `task deploy-main`

### Clean Deployment
If you need to start fresh:
```bash
task destroy
task clean
task bootstrap
task deploy
```

## Environment Variables

Set these in your shell or `.env` file:
- `AWS_PROFILE`: AWS profile to use (default: "default")
- `AWS_REGION`: Primary AWS region (default: ap-northeast-1)

## File Structure

```
/
├── Taskfile.yaml              # Task definitions (moved from infrastructure/)
├── install-task.sh            # Task installation script
├── backend/
│   └── pyproject.toml         # Source of truth for dependencies
└── infrastructure/
    ├── .layers/               # Generated Lambda layers (gitignored)
    │   ├── requirements.txt   # Auto-generated from backend
    │   └── python/           # Installed dependencies
    ├── stacks/               # CDK stack definitions
    ├── app.py                # CDK app entry point
    └── cdk.out/             # Generated CloudFormation templates
```