import pytest
from backend.src.api.schemas import EvidenceItem
from backend.src.intelligence.evidence_gate import (
    build_evidence_manifest,
    assess_evidence_quality,
    verify_response_citations,
    EvidenceQualityEnum
)

def test_evidence_manifest_and_citation_verification():
    # Setup test evidence items
    items = [
        EvidenceItem(
            id="S1",
            document_id="doc_1",
            title="IPCC Land and Climate Report",
            organization="IPCC",
            publication_year=2022,
            page=45,
            text="Agroforestry systems sequester 0.5 to 2.0 tonnes C/ha/year.",
            score=0.85
        ),
        EvidenceItem(
            id="S2",
            document_id="doc_2",
            title="FAO World Soil Charter",
            organization="FAO",
            publication_year=2021,
            page=12,
            text="Cover crops improve soil biological activity and water retention.",
            score=0.78
        )
    ]

    manifest = build_evidence_manifest(items)
    assert "S1" in manifest
    assert "S2" in manifest
    assert manifest["S1"]["organization"] == "IPCC"

    # Quality assessment
    quality = assess_evidence_quality(items)
    assert quality.status in (EvidenceQualityEnum.STRONG, EvidenceQualityEnum.MODERATE)
    assert quality.has_primary_evidence is True

    # Case 1: Valid generated text with legitimate citations
    valid_text = (
        "According to [S1], agroforestry delivers significant carbon sequestration benefits. "
        "Furthermore, [S2] demonstrates improved soil biological activity."
    )
    is_valid, cited, unverified = verify_response_citations(valid_text, manifest)
    assert is_valid is True
    assert set(cited) == {"S1", "S2"}
    assert len(unverified) == 0

    # Case 2: Hallucinated / Fake citation [S3]
    invalid_text = (
        "Implementing no-till improves microbial biomass by 45% [S3]."
    )
    is_valid, cited, unverified = verify_response_citations(invalid_text, manifest)
    assert is_valid is False
    assert "S3" in unverified
