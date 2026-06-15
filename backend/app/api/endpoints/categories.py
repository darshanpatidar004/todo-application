from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.database.session import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.category import Category as CategorySchema, CategoryCreate, CategoryUpdate

router = APIRouter()

@router.get("/", response_model=List[CategorySchema])
def read_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    return db.query(Category).filter(Category.user_id == current_user.id).offset(skip).limit(limit).all()

@router.post("/", response_model=CategorySchema)
def create_category(
    *,
    db: Session = Depends(get_db),
    category_in: CategoryCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    category = Category(
        **category_in.model_dump(),
        user_id=current_user.id
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.put("/{id}", response_model=CategorySchema)
def update_category(
    *,
    db: Session = Depends(get_db),
    id: int,
    category_in: CategoryUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    category = db.query(Category).filter(Category.id == id, Category.user_id == current_user.id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.delete("/{id}", response_model=CategorySchema)
def delete_category(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    category = db.query(Category).filter(Category.id == id, Category.user_id == current_user.id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
    return category
