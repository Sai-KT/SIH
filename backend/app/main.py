from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.inspections import router as inspections_router

app = FastAPI(
    title="SIH26034 Legal Metrology API",
    description="Backend API for packaged commodity compliance checking under the Legal Metrology (Packaged Commodities) Rules, 2011.",
    version="1.0.0",
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(inspections_router)


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint returning basic service status."""
    return {"message": "SIH26034 API is running"}


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint to monitor application uptime."""
    return {"status": "healthy"}
