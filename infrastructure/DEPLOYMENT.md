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
uv sync
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
task lint
task test
```

## Architecture

### Lambda Layers
- **Dependencies Layer**: Contains FastAPI, Pydantic, Mangum, and other Python dependencies
- **AWS Powertools Layer**: AWS-managed layer for observability and utilities

### Cross-Region Setup
- **WAF Stack** (us-east-1): Creates WebACL for CloudFront
- **Main Stack** (ap-northeast-1): Creates Lambda, API Gateway, S3, DynamoDB, CloudFront

### Key Features
- ✅ Lambda layers to reduce deployment size
- ✅ Cross-region references with SSM parameters
- ✅ AWS Powertools for observability
- ✅ Automated dependency management
- ✅ Infrastructure as Code with CDK

## Troubleshooting

### Lambda Size Issues
If you encounter "Unzipped size must be smaller than 262144000 bytes" error:
1. Ensure dependencies are in layers: `task install-deps`
2. Check that `.layers/` directory exists and contains dependencies
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
infrastructure/
├── Taskfile.yaml           # Task definitions
├── requirements.txt        # Lambda layer dependencies
├── .layers/               # Generated Lambda layers (gitignored)
├── stacks/                # CDK stack definitions
├── app.py                 # CDK app entry point
└── cdk.out/              # Generated CloudFormation templates
```