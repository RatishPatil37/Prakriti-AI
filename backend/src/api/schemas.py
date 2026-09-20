from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

class EvidenceQualityEnum(str, Enum):
    STRONG = "Strong"
    MODERATE = "Moderate"
    LIMITED = "Limited"
    INSUFFICIENT = "Insufficient"

class EnvironmentalContext(BaseModel):
    region_or_coords: Optional[str] = Field(default=None, description="Geographic region, locality or lat/lon coordinates")
    climate_zone: Optional[str] = Field(default=None, description="Climate classification (e.g. semi-arid, tropical, temperate)")
    soil_organic_carbon_pct: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Soil Organic Carbon percentage")
    soil_ph: Optional[float] = Field(default=None, ge=0.0, le=14.0, description="Soil pH value")
    annual_rainfall_mm: Optional[float] = Field(default=None, ge=0.0, description="Mean annual rainfall in mm")
    temperature_c: Optional[float] = Field(default=None, description="Average temperature in Celsius")
    current_land_use: Optional[str] = Field(default=None, description="Current land use (e.g. monoculture wheat, degraded pasture)")
    crop_or_vegetation: Optional[str] = Field(default=None, description="Dominant crops or natural vegetation")
    water_availability: Optional[str] = Field(default=None, description="Water source and availability (e.g. rainfed, irrigated, drought-prone)")
    target_goals: List[str] = Field(default_factory=list, description="Target restoration goals (e.g. carbon sequestration, pollinator diversity)")
    # Additional Challenge Environmental Indicators (Optional)
    soil_moisture_pct: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Volumetric soil moisture percentage")
    species_richness_count: Optional[int] = Field(default=None, ge=0, description="Observed or surveyed species richness count")
    habitat_diversity_index: Optional[float] = Field(default=None, ge=0.0, description="Habitat diversity index (e.g. Shannon index)")
    pollution_level: Optional[str] = Field(default=None, description="Pollution indicators (e.g. nitrate runoff, pesticide residue)")
    deforestation_impact: Optional[str] = Field(default=None, description="Forest canopy change or deforestation status")

    @field_validator("*", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v

class ConversationTurn(BaseModel):
    role: str = Field(..., description="Role: user, assistant, or system")
    content: str = Field(..., description="Message content")

class QueryFilters(BaseModel):
    region: Optional[str] = None
    source_type: Optional[str] = None

class QueryRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="User question or query regarding environmental ecosystem (Max 1000 chars)"
    )
    environmental_context: Optional[EnvironmentalContext] = Field(
        default_factory=EnvironmentalContext,
        description="Optional structured environmental measurements"
    )
    conversation_context: List[ConversationTurn] = Field(
        default_factory=list,
        description="Recent conversation turns (limited to last 6-10 turns)"
    )
    filters: Optional[QueryFilters] = Field(default=None, description="Optional search filters")
    session_id: Optional[str] = Field(default=None, description="Optional conversation session ID for trace grouping")

    @field_validator("question")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()

class EvidenceItem(BaseModel):
    id: str = Field(..., description="Stable citation ID (e.g. S1, S2)")
    document_id: str
    parent_id: Optional[str] = None
    title: str
    organization: str
    publication_year: Optional[int] = None
    doi: Optional[str] = None
    source_url: Optional[str] = None
    page: Optional[int] = None
    section: Optional[str] = None
    score: float = 0.0
    text: str
    scope: str = "public"
    owner_user_id: Optional[str] = None

class EvidenceQualityAssessment(BaseModel):
    status: EvidenceQualityEnum
    reasons: List[str] = Field(default_factory=list)
    sources_count: int = 0
    independent_orgs: List[str] = Field(default_factory=list)
    has_primary_evidence: bool = False

class StreamDoneMetrics(BaseModel):
    auth_ms: float = 0.0
    completeness_ms: float = 0.0
    retrieval_ms: float = 0.0
    parent_ms: float = 0.0
    prompt_ms: float = 0.0
    llm_ttft_ms: float = 0.0
    first_sse_ms: float = 0.0
    total_ms: float = 0.0
    request_id: str

class ClarificationPayload(BaseModel):
    is_incomplete: bool = True
    missing_fields: List[str]
    suggested_questions: List[str]
    context_extracted: Dict[str, Any]

class DocumentMetadata(BaseModel):
    id: str
    owner_user_id: str
    title: str
    storage_path: Optional[str] = None
    scope: str = "private"
    status: str
    content_hash: str
    page_count: Optional[int] = 0
    chunk_count: Optional[int] = 0
    created_at: Optional[str] = None
