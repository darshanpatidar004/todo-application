from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.api import deps
from app.database.session import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.task import Task as TaskSchema, TaskCreate, TaskUpdate, TaskSummary

router = APIRouter()

@router.get("/", response_model=List[TaskSchema])
def read_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    is_completed: Optional[bool] = None,
    search: Optional[str] = None,
) -> Any:
    query = db.query(Task).filter(Task.user_id == current_user.id)
    
    if category_id is not None:
        query = query.filter(Task.category_id == category_id)
    if is_completed is not None:
        query = query.filter(Task.is_completed == is_completed)
    if search:
        query = query.filter(
            or_(
                Task.title.ilike(f"%{search}%"),
                Task.description.ilike(f"%{search}%")
            )
        )
    
    return query.offset(skip).limit(limit).all()

@router.get("/summary", response_model=TaskSummary)
def get_task_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    total = db.query(Task).filter(Task.user_id == current_user.id).count()
    completed = db.query(Task).filter(Task.user_id == current_user.id, Task.is_completed == True).count()
    pending = total - completed
    return {"total": total, "completed": completed, "pending": pending}

from app.models.notification import Notification
...
@router.post("/", response_model=TaskSchema)
def create_task(
    *,
    db: Session = Depends(get_db),
    task_in: TaskCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    task = Task(
        **task_in.model_dump(),
        user_id=current_user.id
    )
    db.add(task)
    
    # System Notification
    notification = Notification(
        title="Mission Initialized",
        message=f"Objective '{task.title}' has been logged into your vault.",
        user_id=current_user.id
    )
    db.add(notification)
    
    db.commit()
    db.refresh(task)
    return task

@router.get("/{id}", response_model=TaskSchema)
def read_task(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    task = db.query(Task).filter(Task.id == id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/{id}", response_model=TaskSchema)
def update_task(
    *,
    db: Session = Depends(get_db),
    id: int,
    task_in: TaskUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    task = db.query(Task).filter(Task.id == id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    
    # Success Notification on Completion
    if update_data.get("is_completed") is True:
        notification = Notification(
            title="Mission Success",
            message=f"Elite achievement: Objective '{task.title}' has been successfully completed.",
            user_id=current_user.id
        )
        db.add(notification)
    
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{id}", response_model=TaskSchema)
def delete_task(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    task = db.query(Task).filter(Task.id == id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return task
