from fastapi import FastAPI
app = FastAPI(title="Njirani API")

@app.get("/")
def root():
    return {"status": "running"}