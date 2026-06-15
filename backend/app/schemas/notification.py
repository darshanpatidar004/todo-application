from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    title: str
    message: str
    is_read: Optional[bool] = False

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = True

class Notification(NotificationBase):
    id: int
    created_at: datetime
    user_id: int

    class Config:
        from_attributes = True
