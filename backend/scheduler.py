import threading
import time
from datetime import datetime
import json, base64
from db import SessionLocal
from models import ScheduledPost, LinkedInUser, TwitterUser

from sqlalchemy.orm import Session

# Import posting helpers
from routes.linkedin import post_text_and_images, refresh_access_token
from routes.twitter import upload_media
import requests
from utils.storage import MEDIA_DIR
import os


def _fetch_image_bytes(entry: str):
    # entry may be: http(s) URL, absolute local path, /media/<file>, data URI, or raw base64
    try:
        if not entry:
            return None
        if entry.startswith("http://") or entry.startswith("https://"):
            r = requests.get(entry)
            if r.status_code == 200:
                return r.content
            return None
        if entry.startswith("/media/"):
            fname = entry.split("/media/")[-1]
            path = os.path.join(MEDIA_DIR, fname)
            if os.path.exists(path):
                with open(path, "rb") as f:
                    return f.read()
            return None
        if os.path.isabs(entry) and os.path.exists(entry):
            with open(entry, "rb") as f:
                return f.read()
        # data URI
        if entry.startswith("data:") and ";base64," in entry:
            b64 = entry.split(";base64,")[-1]
            return base64.b64decode(b64)
        # assume raw base64
        return base64.b64decode(entry)
    except Exception:
        return None


def process_post(db: Session, post: ScheduledPost):
    try:
        imgs = json.loads(post.images or "[]")
        image_bytes_list = []
        for e in imgs:
            b = _fetch_image_bytes(e)
            if b:
                image_bytes_list.append(b)

        if post.platform == "linkedin":
            linked = db.query(LinkedInUser).filter(LinkedInUser.user_id == post.user_id).first()
            if not linked:
                print(f"[SCHED] No LinkedIn linked account for user {post.user_id}")
                return False
            # optionally refresh token if present and likely expired
            try:
                from datetime import datetime
                if getattr(linked, "expires_at", None):
                    try:
                        exp = datetime.fromisoformat(linked.expires_at)
                        # refresh if exp is in the past
                        if exp <= datetime.utcnow():
                            print(f"[SCHED] LinkedIn token expired for user {post.user_id}, attempting refresh")
                            refreshed = refresh_access_token(linked, db)
                            print(f"[SCHED] Refresh result: {refreshed}")
                    except Exception:
                        pass
            except Exception:
                pass
            # call helper
            resp = post_text_and_images(linked.access_token, linked.linkedin_id, post.text, image_bytes_list)
            print(f"[SCHED] LinkedIn post result: {resp}")
        elif post.platform == "twitter":
            # Build oauth session to call Twitter endpoints; reuse logic from twitter module
            tw = db.query(TwitterUser).filter(TwitterUser.user_id == post.user_id).first()
            if not tw:
                print(f"[SCHED] No Twitter linked account for user {post.user_id}")
                return False
            # use requests with oauth1? Simplest: re-use twitter route logic by calling upload_media and posting
            from requests_oauthlib import OAuth1Session
            from config import TWITTER_API_KEY, TWITTER_API_SECRET
            oauth = OAuth1Session(
                TWITTER_API_KEY,
                client_secret=TWITTER_API_SECRET,
                resource_owner_key=tw.access_token,
                resource_owner_secret=tw.access_token_secret,
            )
            media_ids = []
            for b in image_bytes_list:
                media_id = upload_media(oauth, b)
                media_ids.append(media_id)
            tweet_payload = {"text": post.text}
            if media_ids:
                tweet_payload["media"] = {"media_ids": media_ids}
            url = "https://api.twitter.com/2/tweets"
            r = oauth.post(url, json=tweet_payload)
            print(f"[SCHED] Tweet response: {r.status_code} - {r.text}")
        # mark processed
        post.processed = 1
        db.add(post)
        db.commit()
        return True
    except Exception as e:
        print(f"[SCHED] Error processing post {post.id}: {e}")
        return False


def scheduler_loop(poll_interval=15):
    print("[SCHED] Scheduler started")
    while True:
        try:
            db = SessionLocal()
            now = datetime.utcnow().isoformat()
            posts = db.query(ScheduledPost).filter(ScheduledPost.processed == 0).all()
            for p in posts:
                try:
                    # compare ISO strings (assume stored in ISO)
                    if p.scheduled_time <= now:
                        print(f"[SCHED] Processing scheduled post {p.id} for platform {p.platform}")
                        process_post(db, p)
                except Exception as e:
                    print(f"[SCHED] inner loop error: {e}")
            db.close()
        except Exception as e:
            print(f"[SCHED] Scheduler error: {e}")
        time.sleep(poll_interval)


def start_scheduler():
    t = threading.Thread(target=scheduler_loop, daemon=True)
    t.start()