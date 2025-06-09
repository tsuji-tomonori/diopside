# Diopside Backend

Backend API for 白雪巴 VTuber fan site - Archive management system

## 🚀 Features

- **FastAPI** with Python 3.12+ and full type hints
- **DynamoDB** integration for video archive data
- **RESTful API** with comprehensive endpoints
- **Automatic documentation** with OpenAPI/Swagger
- **CORS support** for frontend integration
- **Comprehensive testing** with pytest
- **Code quality** with mypy and ruff

## 📋 API Endpoints

### Core Endpoints

- `GET /` - Health check
- `GET /health` - Service health status
- `GET /docs` - Interactive API documentation
- `GET /redoc` - Alternative API documentation

### Video Endpoints

- `GET /api/videos?year=YYYY` - Get videos by year (with pagination)
- `GET /api/videos/{video_id}` - Get single video by ID
- `GET /api/videos/by-tag?path=tag/path` - Get videos by hierarchical tag path
- `GET /api/videos/random?count=N` - Get random videos for discovery
- `GET /api/videos/memory?pairs=N` - Get thumbnail pairs for memory game

### Tag Endpoints

- `GET /api/tags` - Get hierarchical tag tree structure

## 🏗️ Architecture

```
backend/
├── app/
│   ├── models/          # Pydantic data models
│   ├── services/        # Business logic layer
│   ├── routers/         # API route handlers
│   └── main.py         # FastAPI application
├── tests/              # Test suite
├── main.py            # Application entry point
└── pyproject.toml     # Project configuration
```

## 🛠️ Development Setup

### Prerequisites

- Python 3.12+
- uv (Python package manager)

### Installation

```bash
# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv sync

# Activate virtual environment
source .venv/bin/activate  # Linux/macOS
# or
.venv\Scripts\activate     # Windows
```

### Running the Application

```bash
# Development server with hot reload
uv run python main.py

# Or using uvicorn directly
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🧪 Testing

```bash
# Run all tests
uv run pytest

# Run tests with coverage
uv run pytest --cov=app

# Run specific test file
uv run pytest tests/test_models.py

# Run tests in verbose mode
uv run pytest -v
```

## 🔍 Code Quality

```bash
# Type checking with mypy
uv run mypy app/

# Linting and formatting with ruff
uv run ruff check app/
uv run ruff format app/

# Run all quality checks
uv run mypy app/ && uv run ruff check app/ && uv run ruff format app/
```

## 📊 Data Models

### Video Model

```python
{
    "video_id": "dQw4w9WgXcQ",           # YouTube video ID
    "title": "【ホラーゲーム】Cry of Fear", # Video title
    "tags": ["ゲーム実況", "ホラー"],      # Hierarchical tags
    "year": 2023,                        # Publication year
    "thumbnail_url": "https://...",      # Thumbnail URL
    "created_at": "2023-10-15T14:30:00Z" # ISO8601 timestamp
}
```

### Tag Tree Structure

```python
{
    "name": "ゲーム実況",
    "children": [
        {
            "name": "ホラー",
            "children": [
                {"name": "Cry of Fear", "count": 5}
            ],
            "count": 1
        }
    ],
    "count": 1
}
```

## 🗄️ Database Schema

### DynamoDB Table: `videos`

- **Partition Key**: `video_id` (String)
- **GSI1**: `year` (Number) + `video_id` (String) for year-based queries

### Attributes

- `video_id`: String - YouTube video ID
- `title`: String - Video title
- `tags`: List<String> - Hierarchical tags
- `year`: Number - Publication year
- `thumbnail_url`: String - Thumbnail URL
- `created_at`: String - ISO8601 timestamp

## 🚀 Deployment

This application is designed to run on AWS Lambda with:

- **AWS Lambda**: Serverless compute
- **DynamoDB**: NoSQL database
- **API Gateway**: HTTP API routing
- **CloudFront**: CDN and caching

See the `infrastructure/` directory for AWS CDK deployment configuration.

## 🔧 Configuration

Environment variables:

- `AWS_REGION`: AWS region (default: us-east-1)
- `DYNAMODB_TABLE_NAME`: DynamoDB table name (default: videos)

## 📝 API Usage Examples

### Get videos from 2023

```bash
curl "http://localhost:8000/api/videos?year=2023&limit=10"
```

### Get tag hierarchy

```bash
curl "http://localhost:8000/api/videos/by-tag?path=ゲーム実況/ホラー"
```

### Get random videos

```bash
curl "http://localhost:8000/api/videos/random?count=3"
```

### Get memory game thumbnails

```bash
curl "http://localhost:8000/api/videos/memory?pairs=8"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and quality checks
5. Submit a pull request

## 📄 License

This project is part of the Diopside VTuber fan site system.