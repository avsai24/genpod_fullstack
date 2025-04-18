from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import files, settings, prompt_routes
from .services.file_events import FileEventsService
import logging
from pathlib import Path
import os

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]  # Required for SSE
)

# Get the project root directory
PROJECT_ROOT = Path(__file__).parent.parent.parent

# Initialize file events service
file_events_service = FileEventsService(str(PROJECT_ROOT))

@app.on_event("startup")
async def startup_event():
    """Startup event handler."""
    try:
        logger.info("🚀 Starting up application...")
        # Start file watcher
        file_events_service.start_watching()
        logger.info("✅ File watcher started")
    except Exception as e:
        logger.error(f"❌ Error during startup: {str(e)}", exc_info=True)

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler."""
    try:
        logger.info("🛑 Shutting down application...")
        # Stop file watcher
        file_events_service.stop_watching()
        logger.info("✅ File watcher stopped")
    except Exception as e:
        logger.error(f"❌ Error during shutdown: {str(e)}", exc_info=True)

# Include routers
app.include_router(files.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(prompt_routes.router, prefix="/api")

# Add a health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Add a reload endpoint
@app.post("/reload")
async def reload():
    """Trigger a reload of the application."""
    try:
        logger.info("🔄 Reloading application...")
        # Stop the file watcher
        file_events_service.stop_watching()
        # Start it again
        file_events_service.start_watching()
        logger.info("✅ Application reloaded")
        return {"status": "reloaded"}
    except Exception as e:
        logger.error(f"❌ Error during reload: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}

@app.get("/")
async def root():
    return {"message": "Genpod API Server"}

if __name__ == "__main__":
    import uvicorn
    # Disable auto-reload and run the server
    uvicorn.run(
        "genpod_backend.server.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Disable auto-reload
        log_level="debug"
    ) 