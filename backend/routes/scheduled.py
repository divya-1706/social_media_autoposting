from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
import json, base64

from db import get_db
from models import ScheduledPost
from routes.auth import get_current_user, User
import os

router = APIRouter(prefix="/scheduled", tags=["Scheduled"])


@router.get("/")
def list_scheduled(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    posts = db.query(ScheduledPost).filter(ScheduledPost.user_id == current_user.id).order_by(ScheduledPost.id.desc()).all()
    out = []
    for p in posts:
        imgs = json.loads(p.images or "[]")
        thumb = None
        if imgs and len(imgs) > 0:
            first = imgs[0]
            # If saved as S3 or remote URL, use directly
            if isinstance(first, str) and (first.startswith("http://") or first.startswith("https://")):
                thumb = first
            else:
                # If stored as absolute local path, convert to media route
                try:
                    if isinstance(first, str) and os.path.isabs(first) and os.path.exists(first):
                        thumb = "/media/" + os.path.basename(first)
                    elif isinstance(first, str) and first.startswith("/media/"):
                        thumb = first
                    else:
                        # assume base64 string
                        thumb = f"data:image/jpeg;base64,{first}"
                except Exception:
                    thumb = None
        out.append({
            "id": p.id,
            "platform": p.platform,
            "text": p.text,
            "scheduled_time": p.scheduled_time,
            "processed": bool(p.processed),
            "image_count": len(imgs),
            "thumbnail": thumb,
        })
    return out


@router.delete("/{post_id}")
def delete_scheduled(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(ScheduledPost).filter(ScheduledPost.id == post_id, ScheduledPost.user_id == current_user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Scheduled post not found")
    if post.processed:
        raise HTTPException(status_code=400, detail="Cannot delete a processed post")
    db.delete(post)
    db.commit()
    return {"message": "Deleted"}


@router.put("/{post_id}")
def reschedule_post(post_id: int, scheduled_time: str = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(ScheduledPost).filter(ScheduledPost.id == post_id, ScheduledPost.user_id == current_user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Scheduled post not found")
    if post.processed:
        raise HTTPException(status_code=400, detail="Cannot reschedule a processed post")
    post.scheduled_time = scheduled_time
    db.add(post)
    db.commit()
    return {"message": "Rescheduled", "scheduled_time": scheduled_time}
