import os
import sys
import uuid
import logging

# Ensure project root is on PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.src.ingestion.parser import DocumentParser
from backend.src.ingestion.chunker import DocumentChunker
from backend.src.ingestion.indexer import DocumentIndexer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_public_kb")

def seed_public_knowledge_base():
    """
    Ingests ONLY files already present in data/corpus/ into Qdrant Cloud under scope='public'.
    Per mandatory constraint: Does not download, generate, or summarize any external files.
    """
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    corpus_dir = os.path.join(project_root, "data", "corpus")

    if not os.path.exists(corpus_dir):
        logger.warning(f"Corpus directory not found at: {corpus_dir}")
        return

    supported_extensions = (".pdf", ".txt", ".md")
    files_to_index = [
        f for f in os.listdir(corpus_dir)
        if os.path.isfile(os.path.join(corpus_dir, f)) and f.lower().endswith(supported_extensions)
    ]

    if not files_to_index:
        logger.info(
            "No user-provided scientific files found in data/corpus/. "
            "Please place user-provided scientific papers (PDF/TXT/MD) in data/corpus/ "
            "to populate the public scientific knowledge base."
        )
        return

    logger.info(f"Found {len(files_to_index)} user-provided file(s) in data/corpus/ to ingest.")

    total_chunks_indexed = 0

    for filename in files_to_index:
        file_path = os.path.join(corpus_dir, filename)
        logger.info(f"Processing user-provided document: {filename}")

        try:
            with open(file_path, "rb") as f:
                file_bytes = f.read()

            if filename.lower().endswith(".pdf"):
                # Corpus documents may be long research reports, allow full page parsing
                pages = DocumentParser.parse_pdf_bytes(file_bytes, enforce_quota=False)
            else:
                pages = DocumentParser.parse_text_bytes(file_bytes)

            if not pages:
                logger.warning(f"No text extracted from {filename}")
                continue

            chunks = DocumentChunker.chunk_pages(pages)
            doc_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, filename))

            # Detect authentic organization, year, DOI and title from document name
            fn_lower = filename.lower()
            if "ipbes" in fn_lower and "2018" in fn_lower:
                organization = "IPBES"
                publication_year = 2018
                title = "IPBES (2018) — Land Degradation and Restoration (SPM)"
                doi = "10.5281/zenodo.3237392"
                source_url = "https://doi.org/10.5281/zenodo.3237392"
            elif "ipbes" in fn_lower and "2019" in fn_lower:
                organization = "IPBES"
                publication_year = 2019
                title = "IPBES (2019) — Global Assessment Report on Biodiversity & Ecosystem Services (SPM)"
                doi = "10.5281/zenodo.3832005"
                source_url = "https://doi.org/10.5281/zenodo.3832005"
            elif "ipcc" in fn_lower:
                organization = "IPCC"
                publication_year = 2019
                title = "IPCC (2019) — Climate Change and Land (SPM)"
                doi = "10.1017/9781009157988"
                source_url = "https://www.ipcc.ch/srccl/"
            elif "iucn" in fn_lower:
                organization = "IUCN"
                publication_year = 2020
                title = "IUCN (2020) — Global Ecosystem Typology 2.0"
                doi = "10.2305/IUCN.CH.2020.13.en"
                source_url = "https://doi.org/10.2305/IUCN.CH.2020.13.en"
            else:
                organization = "Public Scientific Corpus"
                publication_year = None
                title = os.path.splitext(filename)[0].replace("_", " ").title()
                doi = None
                source_url = None

            # Ingest as public scientific knowledge
            count = DocumentIndexer.index_document_chunks(
                document_id=doc_id,
                title=title,
                chunks=chunks,
                scope="public",
                owner_user_id=None,
                organization=organization,
                publication_year=publication_year,
                source_type="primary_research",
                doi=doi,
                source_url=source_url
            )
            total_chunks_indexed += count
            logger.info(f"Successfully indexed {count} chunks for '{title}' by [{organization}] (Document ID: {doc_id})")
        except Exception as e:
            logger.error(f"Failed to process {filename}: {e}", exc_info=True)

    logger.info(f"Seeding completed. Total public chunks indexed: {total_chunks_indexed}")

if __name__ == "__main__":
    seed_public_knowledge_base()
