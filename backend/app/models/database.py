from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Table, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime
from app.core.config import settings

Base = declarative_base()

photo_tags = Table(
    'photo_tags',
    Base.metadata,
    Column('photo_id', Integer, ForeignKey('photos.id', ondelete='CASCADE')),
    Column('tag_id', Integer, ForeignKey('tags.id', ondelete='CASCADE'))
)

photo_albums = Table(
    'photo_albums',
    Base.metadata,
    Column('photo_id', Integer, ForeignKey('photos.id', ondelete='CASCADE')),
    Column('album_id', Integer, ForeignKey('albums.id', ondelete='CASCADE'))
)

photo_people = Table(
    'photo_people',
    Base.metadata,
    Column('photo_id', Integer, ForeignKey('photos.id', ondelete='CASCADE')),
    Column('person_id', Integer, ForeignKey('people.id', ondelete='CASCADE'))
)


class Photo(Base):
    __tablename__ = 'photos'
    
    id = Column(Integer, primary_key=True, index=True)
    file_path = Column(String, unique=True, nullable=False, index=True)
    file_name = Column(String, nullable=False)
    file_size = Column(Integer)
    file_hash = Column(String, index=True)
    phash = Column(String, index=True)
    
    width = Column(Integer)
    height = Column(Integer)
    format = Column(String)
    
    taken_at = Column(DateTime, index=True)
    imported_at = Column(DateTime, default=datetime.utcnow, index=True)
    modified_at = Column(DateTime)
    
    latitude = Column(Float)
    longitude = Column(Float)
    location_name = Column(String)
    
    camera_make = Column(String)
    camera_model = Column(String)
    
    processed = Column(Boolean, default=False, index=True)
    processing_error = Column(Text)
    is_favorite = Column(Boolean, default=False, index=True)
    
    # AI-generated content
    ocr_text = Column(Text)
    object_tags = Column(String)
    scene_tags = Column(String)
    quality_score = Column(Float)
    
    thumbnail_path = Column(String)
    preview_path = Column(String)
    
    clip_embedding_id = Column(Integer, ForeignKey('embeddings.id'))
    
    metadata_json = Column(JSON)
    
    faces = relationship('Face', back_populates='photo', cascade='all, delete-orphan')
    tags = relationship('Tag', secondary=photo_tags, back_populates='photos')
    albums = relationship('Album', secondary=photo_albums, back_populates='photos')
    people = relationship('Person', secondary=photo_people, back_populates='photos')
    events = relationship('Event', secondary='event_photos', back_populates='photos')
    clip_embedding = relationship('Embedding', foreign_keys=[clip_embedding_id])


class Face(Base):
    __tablename__ = 'faces'
    
    id = Column(Integer, primary_key=True, index=True)
    photo_id = Column(Integer, ForeignKey('photos.id', ondelete='CASCADE'), nullable=False, index=True)
    person_id = Column(Integer, ForeignKey('people.id', ondelete='SET NULL'), index=True)
    
    bbox_x = Column(Float, nullable=False)
    bbox_y = Column(Float, nullable=False)
    bbox_width = Column(Float, nullable=False)
    bbox_height = Column(Float, nullable=False)
    
    confidence = Column(Float, nullable=False)
    
    landmarks = Column(JSON)
    
    embedding_id = Column(Integer, ForeignKey('embeddings.id'))
    
    age = Column(Integer)
    gender = Column(String)
    
    is_primary = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    photo = relationship('Photo', back_populates='faces')
    person = relationship('Person', back_populates='faces', foreign_keys=[person_id])
    embedding = relationship('Embedding', foreign_keys=[embedding_id])


class PersonGroup(Base):
    __tablename__ = 'person_groups'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String)
    color = Column(String)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    members = relationship('Person', back_populates='group')


class Person(Base):
    __tablename__ = 'people'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    cluster_id = Column(Integer, index=True)
    group_id = Column(Integer, ForeignKey('person_groups.id'), nullable=True)
    
    face_count = Column(Integer, default=0)
    primary_face_id = Column(Integer, ForeignKey('faces.id'))
    
    thumbnail_path = Column(String)
    
    is_verified = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    faces = relationship('Face', back_populates='person', foreign_keys='Face.person_id')
    photos = relationship('Photo', secondary=photo_people, back_populates='people')
    group = relationship('PersonGroup', back_populates='members')


class Embedding(Base):
    __tablename__ = 'embeddings'
    
    id = Column(Integer, primary_key=True, index=True)
    embedding_type = Column(String, nullable=False, index=True)
    
    faiss_index = Column(Integer, index=True)
    
    vector_dim = Column(Integer)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class Tag(Base):
    __tablename__ = 'tags'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    category = Column(String, index=True)
    
    auto_generated = Column(Boolean, default=False)
    
    photo_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    photos = relationship('Photo', secondary=photo_tags, back_populates='tags')


class Album(Base):
    __tablename__ = 'albums'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    
    album_type = Column(String, index=True)
    
    is_smart = Column(Boolean, default=False)
    smart_rules = Column(JSON)
    
    cover_photo_id = Column(Integer, ForeignKey('photos.id'))
    
    photo_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    photos = relationship('Photo', secondary=photo_albums, back_populates='albums')


event_photos = Table(
    'event_photos',
    Base.metadata,
    Column('event_id', Integer, ForeignKey('events.id', ondelete='CASCADE')),
    Column('photo_id', Integer, ForeignKey('photos.id', ondelete='CASCADE'))
)


class Event(Base):
    __tablename__ = 'events'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False, index=True)
    
    location_name = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    
    photo_count = Column(Integer, default=0)
    
    cover_photo_id = Column(Integer, ForeignKey('photos.id'))
    
    auto_generated = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    photos = relationship('Photo', secondary=event_photos, back_populates='events')


class ProcessingJob(Base):
    __tablename__ = 'processing_jobs'
    
    id = Column(Integer, primary_key=True, index=True)
    job_type = Column(String, nullable=False, index=True)
    
    status = Column(String, default='pending', index=True)
    
    photo_id = Column(Integer, ForeignKey('photos.id', ondelete='CASCADE'))
    
    progress = Column(Float, default=0.0)
    
    error_message = Column(Text)
    
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
