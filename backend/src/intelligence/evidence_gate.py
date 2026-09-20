import re
from typing import List, Dict, Any, Set, Tuple
from backend.src.api.schemas import EvidenceItem, EvidenceQualityEnum, EvidenceQualityAssessment

CITATION_REGEX = re.compile(r"\[(S\d+)\]")

def build_evidence_manifest(evidence_items: List[EvidenceItem]) -> Dict[str, Dict[str, Any]]:
    """
    Constructs an immutable evidence manifest before generation begins.
    Maps citation labels (e.g. 'S1', 'S2') to source metadata.
    """
    manifest = {}
    for item in evidence_items:
        manifest[item.id] = {
            "id": item.id,
            "title": item.title,
            "organization": item.organization,
            "publication_year": item.publication_year,
            "page": item.page,
            "section": item.section,
            "doi": item.doi,
            "source_url": item.source_url,
            "scope": item.scope
        }
    return manifest

def assess_evidence_quality(evidence_items: List[EvidenceItem]) -> EvidenceQualityAssessment:
    """
    Evaluates Evidence Quality and Coverage systematically.
    Replaces uncalibrated mathematical formulas with qualitative scientific rigor.
    """
    if not evidence_items:
        return EvidenceQualityAssessment(
            status=EvidenceQualityEnum.INSUFFICIENT,
            reasons=["No supporting scientific evidence was retrieved from the indexed knowledge base."],
            sources_count=0,
            independent_orgs=[],
            has_primary_evidence=False
        )

    orgs = list({item.organization for item in evidence_items if item.organization})
    total_sources = len(evidence_items)
    high_relevance_count = sum(1 for item in evidence_items if item.score >= 0.5)

    reasons = []

    # Check for authoritative primary bodies
    authoritative_bodies = {"IPCC", "IPBES", "FAO", "IUCN", "GBIF", "UNEP", "CABI"}
    has_primary = any(any(auth in org.upper() for auth in authoritative_bodies) for org in orgs)

    if has_primary:
        reasons.append("Supported by authoritative global scientific institutions.")

    if len(orgs) >= 2 and total_sources >= 3 and high_relevance_count >= 2:
        status = EvidenceQualityEnum.STRONG
        reasons.append(f"Corroborated across {len(orgs)} independent organizations with high relevance.")
    elif total_sources >= 2 and high_relevance_count >= 1:
        status = EvidenceQualityEnum.MODERATE
        reasons.append("Moderate empirical coverage with relevant domain-specific evidence.")
    elif total_sources >= 1:
        status = EvidenceQualityEnum.LIMITED
        reasons.append("Limited empirical evidence found; inferences should be validated in the field.")
    else:
        status = EvidenceQualityEnum.INSUFFICIENT
        reasons.append("Insufficient evidence retrieved to ground quantitative interventions.")

    return EvidenceQualityAssessment(
        status=status,
        reasons=reasons,
        sources_count=total_sources,
        independent_orgs=orgs,
        has_primary_evidence=has_primary
    )

def is_refusal_response(text: str) -> bool:
    """Detects if response is a standard out-of-scope refusal or redirection."""
    t = text.lower()
    refusal_phrases = [
        "outside what i can help with",
        "focus on environmental and ecological",
        "outside my scope",
        "cannot assist with",
        "unable to answer",
        "outside the scope",
        "not related to environmental",
    ]
    return any(p in t for p in refusal_phrases)

def filter_cited_evidence(
    evidence_items: List[EvidenceItem],
    cited_ids: List[str],
    text: str = ""
) -> List[EvidenceItem]:
    """
    Per RESPONSE_BEHAVIOUR.md:
    retrieved S1,S2,S3 + cited S1 -> UI only shows S1.
    If no sources were cited, or response is a refusal, returns empty list [].
    """
    if not cited_ids or is_refusal_response(text):
        return []
    cited_set = set(cited_ids)
    return [item for item in evidence_items if item.id in cited_set]

def verify_response_citations(
    generated_text: str,
    manifest: Dict[str, Dict[str, Any]]
) -> Tuple[bool, List[str], List[str]]:
    """
    Validates all citation IDs [S#] used in the completed model response against the evidence manifest.
    Returns: (is_valid, cited_ids, unverified_ids)
    Note: Real-time SSE tokens cannot be retroactively retracted once sent; this validation
    is recorded in the final database message record and completion event.
    """
    matches = CITATION_REGEX.findall(generated_text)
    cited_ids = list(dict.fromkeys(matches))  # deduplicate preserving order
    valid_ids = set(manifest.keys())

    unverified = [cid for cid in cited_ids if cid not in valid_ids]
    is_valid = (len(unverified) == 0)

    return is_valid, cited_ids, unverified
