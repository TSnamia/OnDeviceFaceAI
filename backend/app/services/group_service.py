from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.database import Person, PersonGroup


class GroupService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_group(self, name: str, description: str = None, color: str = None) -> PersonGroup:
        """Create a new person group"""
        group = PersonGroup(
            name=name,
            description=description,
            color=color
        )
        self.db.add(group)
        self.db.commit()
        self.db.refresh(group)
        return group
    
    def get_all_groups(self) -> List[PersonGroup]:
        """Get all person groups"""
        return self.db.query(PersonGroup).all()
    
    def get_group(self, group_id: int) -> Optional[PersonGroup]:
        """Get a specific group"""
        return self.db.query(PersonGroup).filter(PersonGroup.id == group_id).first()
    
    def add_person_to_group(self, person_id: int, group_id: int) -> Optional[Person]:
        """Add a person to a group"""
        person = self.db.query(Person).filter(Person.id == person_id).first()
        if not person:
            return None
        
        person.group_id = group_id
        self.db.commit()
        self.db.refresh(person)
        return person
    
    def remove_person_from_group(self, person_id: int) -> Optional[Person]:
        """Remove a person from their group"""
        person = self.db.query(Person).filter(Person.id == person_id).first()
        if not person:
            return None
        
        person.group_id = None
        self.db.commit()
        self.db.refresh(person)
        return person
    
    def get_group_members(self, group_id: int) -> List[Person]:
        """Get all members of a group"""
        return self.db.query(Person).filter(Person.group_id == group_id).all()
    
    def delete_group(self, group_id: int) -> bool:
        """Delete a group (removes people from group but doesn't delete them)"""
        group = self.get_group(group_id)
        if not group:
            return False
        
        # Remove all people from this group
        self.db.query(Person).filter(Person.group_id == group_id).update({Person.group_id: None})
        
        self.db.delete(group)
        self.db.commit()
        return True
    
    def rename_group(self, group_id: int, new_name: str) -> Optional[PersonGroup]:
        """Rename a group"""
        group = self.get_group(group_id)
        if not group:
            return None
        
        group.name = new_name
        self.db.commit()
        self.db.refresh(group)
        return group
