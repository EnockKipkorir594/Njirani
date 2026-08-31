from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="Njirani AI Service",
    version="0.1.0",
    description="LLM-powered matching and support for Njirani"
)

# CORS: Only your Node.js backend should talk to this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Node.js backend URL
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)

# Health check — Node.js calls this to verify the service is up
@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai"}