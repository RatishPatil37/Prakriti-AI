import os
import pymupdf as fitz
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from backend.src.config import settings

class ParsedPage:
    def __init__(self, page_number: int, text: str):
        self.page_number = page_number
        self.text = text

class DocumentParser:
    @staticmethod
    def parse_pdf_bytes(
        file_bytes: bytes,
        max_pages: Optional[int] = None,
        max_size_mb: Optional[float] = None,
        enforce_quota: bool = True
    ) -> List[ParsedPage]:
        # Validate size
        if enforce_quota:
            limit_mb = max_size_mb if max_size_mb is not None else settings.MAX_UPLOAD_SIZE_MB
            size_mb = len(file_bytes) / (1024 * 1024)
            if size_mb > limit_mb:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"PDF exceeds size limit of {limit_mb}MB ({size_mb:.2f}MB provided)"
                )

        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unable to parse PDF document: {str(e)}"
            )

        page_count = len(doc)
        if enforce_quota:
            limit_pages = max_pages if max_pages is not None else settings.MAX_UPLOAD_PAGES
            if page_count > limit_pages:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"PDF page count exceeds maximum of {limit_pages} pages ({page_count} pages provided)"
                )

        pages = []
        for page_num in range(page_count):
            page = doc[page_num]
            text = page.get_text("text")
            if text and text.strip():
                pages.append(ParsedPage(page_number=page_num + 1, text=text.strip()))

        return pages

    @staticmethod
    def parse_text_bytes(file_bytes: bytes) -> List[ParsedPage]:
        size_mb = len(file_bytes) / (1024 * 1024)
        if size_mb > 1.0: # 1 MB text limit
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Text document exceeds 1MB limit"
            )
        try:
            text = file_bytes.decode("utf-8", errors="replace")
            return [ParsedPage(page_number=1, text=text.strip())]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to read text file: {e}"
            )
