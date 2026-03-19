#!/usr/bin/env python3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.models.database import init_db, engine, Base
from app.core.config import settings


def main():
    """Initialize the database"""
    print(f"Initializing database at {settings.DATABASE_URL}")
    
    settings.DATABASE_DIR.mkdir(parents=True, exist_ok=True)
    
    init_db()
    
    print("✓ Database initialized successfully")
    print(f"✓ Database file: {settings.DATABASE_DIR}/photos.db")
    
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    print(f"\n✓ Created {len(tables)} tables:")
    for table in tables:
        print(f"  - {table}")


if __name__ == "__main__":
    main()
