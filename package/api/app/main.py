import os

from aws_lambda_powertools import Logger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from routers.videos import router as videos_router

# Create FastAPI application
app = FastAPI(
    title="Diopside API",
    description="Backend API for diopside",
    version=os.environ["PROJECT_SEMANTIC_VERSION"],
    docs_url="/docs",
    openapi_prefix=f"/{os.environ['PROJECT_MAJOR_VERSION']}/",
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(videos_router)


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint for health check."""
    return {"message": "Diopside API is running", "status": "healthy"}


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "service": "diopside-backend"}


# Initialize AWS Lambda Powertools logger
logger = Logger(service="diopside")


@logger.inject_lambda_context(log_event=True)
def handler(event, context):
    """Lambda handler function."""
    return Mangum(app)(event, context)
