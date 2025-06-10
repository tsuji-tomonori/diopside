"""Entry point for the Diopside backend application."""

from app.main import app

# Lambda handler for AWS Lambda
try:
    from mangum import Mangum
    handler = Mangum(app)
except ImportError:
    # Mangum not available, skip Lambda handler
    pass

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
