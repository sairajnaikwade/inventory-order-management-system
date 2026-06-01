from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas, crud

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/summary", response_model=schemas.DashboardSummary)
def read_dashboard_summary_endpoint(db: Session = Depends(get_db)):
    return crud.get_dashboard_summary(db=db)
