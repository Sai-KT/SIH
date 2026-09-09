from typing import List, Literal, Optional
from pydantic import BaseModel, Field, StrictStr


class InspectionCreate(BaseModel):
    """
    Schema representing the payload to create a new packaged commodity inspection.

    System and database-managed attributes (id, status, inspection_date, created_at)
    are automatically populated upon record creation.
    """

    location: Optional[StrictStr] = Field(
        default=None,
        description="Physical retail market, warehouse, or location where the commodity was inspected",
        examples=["Crawford Market, Mumbai, Maharashtra"],
    )


class ViolationRecord(BaseModel):
    """A single Rule 6 / Rule 7 / Rule 9 violation recorded by the field officer."""

    rule_ref: StrictStr = Field(
        description="Rule reference, e.g. 'Rule 6(1)(e)'",
        examples=["Rule 6(1)(e)"],
    )
    description: StrictStr = Field(
        description="Human-readable violation description",
        examples=["MRP missing or smudged on principal display panel"],
    )
    tag: Optional[StrictStr] = Field(
        default=None,
        description="One-touch violation tag identifier",
        examples=["DUAL_MRP"],
    )


class RapidInspectionCreate(BaseModel):
    """
    Full rapid-audit payload submitted by a field officer in a single API call.

    Combines commodity details, vendor information, Rule 6 audit results, and
    officer identification so the panel can persist a complete inspection record
    without multiple round-trips.
    """

    location: Optional[StrictStr] = Field(
        default=None,
        description="Market / warehouse location where the commodity was inspected",
        examples=["Crawford Market, Mumbai, Maharashtra"],
    )
    vendor_name: Optional[StrictStr] = Field(
        default=None,
        description="Name of the retail vendor / shop being audited",
        examples=["Sharma General Stores"],
    )
    vendor_id: Optional[StrictStr] = Field(
        default=None,
        description="Shop registration or GST ID of the vendor",
    )
    product_name: Optional[StrictStr] = Field(
        default=None,
        description="Name of the packaged commodity under inspection",
        examples=["Britannia Good Day Butter Cookies (200g)"],
    )
    brand_name: Optional[StrictStr] = Field(
        default=None,
        description="Brand or manufacturer name",
    )
    net_quantity: Optional[StrictStr] = Field(
        default=None,
        description="Net quantity as declared on the package",
        examples=["200g"],
    )
    batch_number: Optional[StrictStr] = Field(
        default=None,
        description="Batch / lot number printed on the package",
    )
    inspector_id: Optional[StrictStr] = Field(
        default=None,
        description="UUID of the inspecting officer",
    )
    inspector_badge: Optional[StrictStr] = Field(
        default=None,
        description="Badge number of the inspecting officer",
        examples=["LMO-MH-042"],
    )
    violations: List[ViolationRecord] = Field(
        default_factory=list,
        description="List of Rule 6 / Rule 7 / Rule 9 violations detected during rapid audit",
    )
    status: Literal[
        "COMPLIANT", "NON_COMPLIANT", "REQUIRES_REVIEW", "UNDER_REVIEW"
    ] = Field(
        default="UNDER_REVIEW",
        description="Final compliance status set by the officer after rapid audit",
    )
    compliance_score: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=100.0,
        description="Computed compliance score (0.0 – 100.0)",
    )
    notes: Optional[StrictStr] = Field(
        default=None,
        description="Free-text officer notes attached to this inspection",
    )
