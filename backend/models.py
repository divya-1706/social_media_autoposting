from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from db import Base


class LinkedInUser(Base):
    __tablename__ = "linkedin_users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True)
    linkedin_id = Column(String)
    access_token = Column(String)
    refresh_token = Column(String, nullable=True)
    expires_at = Column(String, nullable=True)  # ISO timestamp or epoch
    
    user = relationship("User", back_populates="linkedin_account")


class TwitterUser(Base):
    __tablename__ = "twitter_users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True)
    twitter_id = Column(String, unique=True, index=True)
    access_token = Column(String)
    access_token_secret = Column(String)
    screen_name = Column(String)

    user = relationship("User", back_populates="twitter_account")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    linkedin_account = relationship("LinkedInUser", back_populates="user", uselist=False)
    twitter_account = relationship("TwitterUser", back_populates="user", uselist=False)


class ScheduledPost(Base):
    __tablename__ = "scheduled_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    platform = Column(String)  # 'linkedin' or 'twitter'
    text = Column(String)
    images = Column(String)  # JSON-encoded list of base64 strings
    scheduled_time = Column(String)  # ISO datetime string
    processed = Column(Integer, default=0)

    user = relationship("User")
