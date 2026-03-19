from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.models.database import get_db, PersonGroup, Person
from app.services.group_service import GroupService

router = APIRouter(prefix="/groups", tags=["groups"])


class GroupResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    color: Optional[str]
    member_count: int = 0
    
    class Config:
        from_attributes = True


class CreateGroupRequest(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = None


class AddToGroupRequest(BaseModel):
    person_id: int
    group_id: int


@router.get("/", response_model=List[GroupResponse])
async def get_all_groups(db: Session = Depends(get_db)):
    """Get all person groups"""
    service = GroupService(db)
    groups = service.get_all_groups()
    
    result = []
    for group in groups:
        result.append({
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "color": group.color,
            "member_count": len(group.members)
        })
    
    return result


@router.post("/", response_model=GroupResponse)
async def create_group(
    request: CreateGroupRequest,
    db: Session = Depends(get_db)
):
    """Create a new person group"""
    service = GroupService(db)
    group = service.create_group(
        name=request.name,
        description=request.description,
        color=request.color
    )
    
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "color": group.color,
        "member_count": 0
    }


@router.get("/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific group"""
    service = GroupService(db)
    group = service.get_group(group_id)
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "color": group.color,
        "member_count": len(group.members)
    }


@router.post("/add-person")
async def add_person_to_group(
    request: AddToGroupRequest,
    db: Session = Depends(get_db)
):
    """Add a person to a group"""
    service = GroupService(db)
    person = service.add_person_to_group(request.person_id, request.group_id)
    
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    return {"message": "Person added to group", "person_id": person.id, "group_id": person.group_id}


@router.post("/remove-person/{person_id}")
async def remove_person_from_group(
    person_id: int,
    db: Session = Depends(get_db)
):
    """Remove a person from their group"""
    service = GroupService(db)
    person = service.remove_person_from_group(person_id)
    
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    return {"message": "Person removed from group", "person_id": person.id}


@router.delete("/{group_id}")
async def delete_group(
    group_id: int,
    db: Session = Depends(get_db)
):
    """Delete a group"""
    service = GroupService(db)
    success = service.delete_group(group_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Group not found")
    
    return {"message": "Group deleted"}
