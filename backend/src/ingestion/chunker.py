from typing import List, Dict, Any
from backend.src.ingestion.parser import ParsedPage
from backend.src.ingestion.sanitizer import TextSanitizer

class Chunk:
    def __init__(
        self,
        child_text: str,
        parent_text: str,
        page_start: int,
        page_end: int,
        chunk_index: int
    ):
        self.child_text = child_text
        self.parent_text = parent_text
        self.page_start = page_start
        self.page_end = page_end
        self.chunk_index = chunk_index

class DocumentChunker:
    @staticmethod
    def chunk_pages(pages: List[ParsedPage], child_size_words: int = 180, parent_size_words: int = 700) -> List[Chunk]:
        """
        Creates semantic child chunks (180-280 words) and parent context chunks (700-1100 words).
        Child chunks embed their parent context directly for sub-second Option A retrieval.
        """
        chunks = []
        chunk_idx = 0

        for page in pages:
            clean_text = TextSanitizer.sanitize(page.text)
            words = clean_text.split()
            if not words:
                continue

            # If page is short, create single chunk
            if len(words) <= child_size_words:
                chunks.append(
                    Chunk(
                        child_text=clean_text,
                        parent_text=clean_text,
                        page_start=page.page_number,
                        page_end=page.page_number,
                        chunk_index=chunk_idx
                    )
                )
                chunk_idx += 1
                continue

            # Slide over words with overlap
            step = max(50, child_size_words - 30)
            for i in range(0, len(words), step):
                child_words = words[i:i + child_size_words]
                if not child_words:
                    break

                # Parent context encompasses surrounding window
                p_start = max(0, i - 150)
                p_end = min(len(words), i + child_size_words + 150)
                parent_words = words[p_start:p_end]

                child_str = " ".join(child_words)
                parent_str = " ".join(parent_words)

                chunks.append(
                    Chunk(
                        child_text=child_str,
                        parent_text=parent_str,
                        page_start=page.page_number,
                        page_end=page.page_number,
                        chunk_index=chunk_idx
                    )
                )
                chunk_idx += 1

                if i + child_size_words >= len(words):
                    break

        return chunks
