from typing import Any, Dict
from uuid import UUID
from fastapi import APIRouter, HTTPException, status

from app.database.supabase_client import get_supabase_client
from app.schemas.inspection import InspectionCreate

router = APIRouter(prefix="/api/v1/inspections", tags=["Inspections"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=Dict[str, Any])
@router.post("/", status_code=status.HTTP_201_CREATED, include_in_schema=False, response_model=Dict[str, Any])
async def create_inspection(payload: InspectionCreate) -> Dict[str, Any]:
    """
    Create a new inspection record in Supabase.

    Client provides:
    - location: Optional string (e.g., "Pune")

    Backend controls:
    - status: Hardcoded to "UPLOADED"
    - id, inspection_date, created_at: Managed by PostgreSQL defaults
    """
    try:
        supabase = get_supabase_client()

        # Explicit payload construction ensures client cannot control id, status, etc.
        record_to_insert = {
            "location": payload.location,
            "status": "UPLOADED",
        }

        response = supabase.table("inspections").insert(record_to_insert).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create inspection: Database returned empty response.",
            )

        # Return the newly created inspection record
        return response.data[0]

    except HTTPException:
        raise
    except Exception as exc:
        # Extract clear error message without leaking credentials
        error_msg = getattr(exc, "message", str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while creating inspection: {error_msg}",
        )


@router.get("/{inspection_id}", response_model=Dict[str, Any])
async def get_inspection(inspection_id: UUID) -> Dict[str, Any]:
    """
    Retrieve a specific inspection record by its UUID.

    Returns HTTP 404 if no matching inspection exists.
    """
    try:
        supabase = get_supabase_client()

        response = (
            supabase.table("inspections")
            .select("*")
            .eq("id", str(inspection_id))
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inspection with ID '{inspection_id}' not found.",
            )

        return response.data[0]

    except HTTPException:
        raise
    except Exception as exc:
        error_msg = getattr(exc, "message", str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while retrieving inspection: {error_msg}",
        )

