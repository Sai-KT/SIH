from typing import Optional
from pydantic import BaseModel, Field


class InspectionCreate(BaseModel):
    """
    Schema representing the payload to create a new packaged commodity inspection.

    System and database-managed attributes (id, status, inspection_date, created_at)
    are automatically populated upon record creation.
    """

    location: Optional[str] = Field(
        default=None,
        description="Physical retail market, warehouse, or location where the commodity was inspected",
        examples=["Crawford Market, Mumbai, Maharashtra"],
    )
