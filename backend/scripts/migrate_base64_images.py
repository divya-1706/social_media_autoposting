#!/usr/bin/env python3
"""Migration helper: convert ScheduledPost.images entries that are base64/data-URI/raw into
saved files (S3 or local disk) via utils.storage.save_media and update DB records to point
to the saved path/URL.

Usage:
  python scripts/migrate_base64_images.py

Run from the `backend` folder so imports resolve correctly.
"""
import json
import base64
import re
import os
from db import SessionLocal
from models import ScheduledPost
from utils.storage import save_media


def looks_like_base64(s: str) -> bool:
    if not isinstance(s, str):
        return False
    s = s.strip()
    if not s:
        return False
    # exclude obvious non-base64 entries
    if s.startswith("http://") or s.startswith("https://") or s.startswith("/media/"):
        return False
    # data URI handled separately
    if s.startswith("data:") and ";base64," in s:
        return True
    # heuristics: long strings of base64 chars
    if len(s) < 100:
        return False
    # allow base64 with padding
    b64_re = re.compile(r'^[A-Za-z0-9+/=\n\r]+$')
    return bool(b64_re.match(s))


def extract_base64_from_data_uri(s: str) -> str:
    # data:<mime>;base64,<data>
    try:
        return s.split(";base64,", 1)[1]
    except Exception:
        return ""


def migrate(batch_size=50):
    db = SessionLocal()
    try:
        posts = db.query(ScheduledPost).filter(ScheduledPost.images != None).all()
        total = len(posts)
        print(f"Found {total} scheduled posts with images to inspect")
        migrated = 0
        for p in posts:
            try:
                imgs = json.loads(p.images or "[]")
            except Exception:
                print(f"[WARN] Could not parse images for post {p.id}")
                continue
            changed = False
            for i, entry in enumerate(imgs):
                try:
                    if isinstance(entry, str):
                        if entry.startswith("http://") or entry.startswith("https://") or entry.startswith("/media/"):
                            # already stored as URL/path
                            continue
                        if entry.startswith("data:") and ";base64," in entry:
                            b64 = extract_base64_from_data_uri(entry)
                            try:
                                data = base64.b64decode(b64)
                            except Exception:
                                print(f"[WARN] invalid data URI in post {p.id} index {i}")
                                continue
                            saved = save_media(data, f"scheduled_{p.id}_{i}.jpg")
                            imgs[i] = saved
                            changed = True
                            print(f"[MIGRATE] Post {p.id} image[{i}] data-uri -> {saved}")
                            continue
                        # raw base64?
                        if looks_like_base64(entry):
                            try:
                                data = base64.b64decode(entry)
                            except Exception:
                                print(f"[WARN] invalid base64 in post {p.id} index {i}")
                                continue
                            saved = save_media(data, f"scheduled_{p.id}_{i}.jpg")
                            imgs[i] = saved
                            changed = True
                            print(f"[MIGRATE] Post {p.id} image[{i}] base64 -> {saved}")
                            continue
                    # else: non-string or already fine
                except Exception as e:
                    print(f"[ERROR] processing post {p.id} image[{i}]: {e}")
            if changed:
                p.images = json.dumps(imgs)
                db.add(p)
                db.commit()
                migrated += 1
        print(f"Migration complete. Updated {migrated} posts.")
    finally:
        db.close()


if __name__ == "__main__":
    print("Starting scheduled images migration...")
    migrate()
    print("Done.")
