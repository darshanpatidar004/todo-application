from pydantic import BaseModel
from typing import Optional

class CategoryBase(BaseModel):
    name: str
    color: Optional[str] = "#000000"

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    name: Optional[str] = None

class Category(CategoryBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
