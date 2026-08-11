import os
import uuid
import boto3
from botocore.exceptions import BotoCoreError, ClientError

MEDIA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "scheduled_media")
os.makedirs(MEDIA_DIR, exist_ok=True)

S3_BUCKET = os.getenv("S3_BUCKET")
S3_REGION = os.getenv("S3_REGION")

def save_bytes_to_disk(data: bytes, filename_hint: str = None) -> str:
    name = (filename_hint or str(uuid.uuid4())).replace(" ", "_")
    if not os.path.splitext(name)[1]:
        name = name + ".jpg"
    path = os.path.join(MEDIA_DIR, name)
    # ensure unique
    base, ext = os.path.splitext(name)
    i = 1
    while os.path.exists(path):
        name = f"{base}_{i}{ext}"
        path = os.path.join(MEDIA_DIR, name)
        i += 1
    with open(path, "wb") as f:
        f.write(data)
    return path

def upload_to_s3(data: bytes, key: str) -> str:
    s3 = boto3.client("s3")
    try:
        s3.put_object(Bucket=S3_BUCKET, Key=key, Body=data, ACL="public-read")
        url = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{key}"
        return url
    except (BotoCoreError, ClientError) as e:
        raise

def save_media(data: bytes, filename_hint: str = None) -> str:
    """Save bytes either to S3 (if configured) or to local disk. Returns the stored path or URL."""
    if S3_BUCKET and S3_REGION:
        key = (filename_hint or str(uuid.uuid4())).replace(" ", "_")
        if not os.path.splitext(key)[1]:
            key = key + ".jpg"
        return upload_to_s3(data, key)
    else:
        return save_bytes_to_disk(data, filename_hint)
