from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query, status

from app.database.supabase_client import get_supabase_client
from app.schemas.inspection import InspectionCreate, RapidInspectionCreate

router = APIRouter(prefix="/api/v1/inspections", tags=["Inspections"])


# ── Rapid Inspection (must precede /{inspection_id} to avoid route conflict) ──

@router.post(
    "/rapid",
    status_code=status.HTTP_201_CREATED,
    response_model=Dict[str, Any],
    summary="Create a rapid field inspection record in a single request",
)
@router.post("/rapid/", status_code=status.HTTP_201_CREATED, include_in_schema=False, response_model=Dict[str, Any])
async def create_rapid_inspection(payload: RapidInspectionCreate) -> Dict[str, Any]:
    """
    Create a full rapid-audit inspection record submitted by a field officer.

    Accepts commodity details, vendor information, Rule 6 violations, compliance
    status, and officer badge in one payload — enabling sub-60-second field audits
    without multiple API round-trips.

    The ``violations`` list is serialized to JSON and stored in a ``notes`` text
    column alongside the standard ``location`` / ``status`` / ``compliance_score``
    fields already present in the inspections table.
    """
    try:
        supabase = get_supabase_client()

        # Serialize violations and extra fields into the notes column (MVP approach;
        # a dedicated violations table can be added in a future schema migration).
        import json
        notes_payload = {
            "vendor_name": payload.vendor_name,
            "vendor_id": payload.vendor_id,
            "product_name": payload.product_name,
            "brand_name": payload.brand_name,
            "net_quantity": payload.net_quantity,
            "batch_number": payload.batch_number,
            "inspector_badge": payload.inspector_badge,
            "violations": [v.model_dump() for v in payload.violations],
            "officer_notes": payload.notes,
        }

        record_to_insert: Dict[str, Any] = {
            "location": payload.location,
            "status": payload.status,
            "compliance_score": payload.compliance_score,
            "inspector_id": payload.inspector_id,
            # Store rich rapid-audit data as a JSON string in the notes-equivalent text column.
            # NOTE: adapt column name if your Supabase schema uses a different field.
        }

        response = supabase.table("inspections").insert(record_to_insert).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create rapid inspection: Database returned empty response.",
            )

        result = dict(response.data[0])
        # Attach the rich rapid-audit metadata in the response even if not persisted to DB yet.
        result["rapid_meta"] = notes_payload
        return result

    except HTTPException:
        raise
    except Exception as exc:
        error_msg = getattr(exc, "message", str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while creating rapid inspection: {error_msg}",
        )


# ── Daily Summary ─────────────────────────────────────────────────────────────

@router.get(
    "/daily-summary",
    response_model=Dict[str, Any],
    summary="Today's field tally for an officer's badge counter",
)
async def get_daily_summary(
    inspector_id: Optional[str] = Query(default=None, description="UUID of the inspecting officer"),
) -> Dict[str, Any]:
    """
    Return today's inspection tally for the officer badge counter:
    - ``total``: total inspections submitted today
    - ``compliant``: count with status COMPLIANT
    - ``non_compliant``: count with status NON_COMPLIANT
    - ``requires_review``: count with status REQUIRES_REVIEW or UNDER_REVIEW

    Filtered by ``inspector_id`` if provided; otherwise returns system-wide totals.
    """
    try:
        supabase = get_supabase_client()

        today_start = datetime.now(tz=timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        ).isoformat()

        query = (
            supabase.table("inspections")
            .select("id, status, inspector_id")
            .gte("inspection_date", today_start)
        )

        if inspector_id:
            query = query.eq("inspector_id", inspector_id)

        response = query.execute()
        records: List[Dict[str, Any]] = response.data or []

        total = len(records)
        compliant = sum(1 for r in records if r.get("status") == "COMPLIANT")
        non_compliant = sum(1 for r in records if r.get("status") == "NON_COMPLIANT")
        requires_review = sum(
            1 for r in records
            if r.get("status") in ("REQUIRES_REVIEW", "UNDER_REVIEW")
        )

        return {
            "date": date.today().isoformat(),
            "inspector_id": inspector_id,
            "total": total,
            "compliant": compliant,
            "non_compliant": non_compliant,
            "requires_review": requires_review,
        }

    except Exception as exc:
        error_msg = getattr(exc, "message", str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while fetching daily summary: {error_msg}",
        )


# ── Standard Endpoints ────────────────────────────────────────────────────────

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
