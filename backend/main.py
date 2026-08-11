from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import engine, Base
from routes import linkedin, content, twitter, auth, scheduled
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from migrate_db import run_migrations
run_migrations()

Base.metadata.create_all(bind=engine)

app.include_router(linkedin.router)
app.include_router(content.router)
app.include_router(twitter.router)
app.include_router(auth.router)
app.include_router(scheduled.router)

# Serve scheduled media files from /media
media_dir = os.path.join(os.path.dirname(__file__), "scheduled_media")
os.makedirs(media_dir, exist_ok=True)
app.mount("/media", StaticFiles(directory=media_dir), name="media")

# Start background scheduler for scheduled posts
try:
    from scheduler import start_scheduler
    start_scheduler()
except Exception as e:
    print(f"Failed to start scheduler: {e}")

@app.get("/")
def home():
    return {"message": "Social Media Poster v2 Running", "status": "online"}

@app.get("/health")
def health():
    return {"status": "ok"}