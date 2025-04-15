from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.api import settings 
from server.api import prompt_routes

app = FastAPI()

# Optional: allow frontend to call the backend during dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(settings.router, prefix="/api")
app.include_router(prompt_routes.router, prefix="/api")

@app.get("/")
def read_root():
    return {"status": "Genpod API running ✅"}