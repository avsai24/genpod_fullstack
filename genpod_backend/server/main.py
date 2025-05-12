from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import files, settings, prompt_routes, chat_stream, check_user, profile, register
from .services.file_events import FileEventsService
from .db.init_db import create_users_table_if_not_exists  
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS for frontend (adjust domain for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # For Server-Sent Events
)

# Determine project root (used by file watcher)
PROJECT_ROOT = Path(__file__).parent.parent.parent

# Initialize file watcher service
file_events_service = FileEventsService(str(PROJECT_ROOT))

@app.on_event("startup")
async def startup_event():
    """Handle app startup."""
    try:
        create_users_table_if_not_exists() 
        file_events_service.start_watching()
        logger.info("✅ File watcher started")
    except Exception as e:
        logger.error(f"❌ Startup error: {str(e)}", exc_info=True)

@app.on_event("shutdown")
async def shutdown_event():
    """Handle app shutdown."""
    try:
        file_events_service.stop_watching()
        logger.info("✅ File watcher stopped")
    except Exception as e:
        logger.error(f"❌ Shutdown error: {str(e)}", exc_info=True)

# Include all route groups with proper prefixes
app.include_router(files.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(prompt_routes.router, prefix="/api")
app.include_router(chat_stream.router, prefix="/api/chat")
app.include_router(check_user.router, prefix="/api")
app.include_router(register.router, prefix="/api")
app.include_router(profile.router, prefix="/api")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Manual file watcher reload (optional)
@app.post("/reload")
async def reload():
    """Reload file watcher manually."""
    try:
        file_events_service.stop_watching()
        file_events_service.start_watching()
        return {"status": "reloaded"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Root route
@app.get("/")
async def root():
    return {"message": "Genpod API Server"}

# For standalone execution
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "genpod_backend.server.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="debug"
    )