# Web Research Notes — Darukaa.Earth Assignment

This document records current web observations used to update the architecture.

## Darukaa.Earth

The current Darukaa.Earth site describes itself as a nature intelligence platform and emphasizes science-backed nature intelligence, global datasets, geospatial signals, field evidence, bioacoustics, wildlife cameras, and remote sensing.

Reference:
https://darukaa.earth/

The current biodiversity page emphasizes monitoring, species evidence, biodiversity metrics, real-time alerts, and a collect → analyze → visualize → report workflow.

Reference:
https://darukaa.earth/biodiversity

Design implication:

Use Darukaa's visual language and science/evidence positioning, but create an original AI scientist workspace rather than reproducing the marketing site.

## Qdrant Cloud

Current Qdrant documentation states that the free tier is a single-node cluster with:

- 0.5 vCPU
- 1 GB RAM
- 4 GB disk

Qdrant says this is roughly enough for around one million 768-dimensional vectors, depending on payload/index overhead.

Free clusters can suspend after a week of inactivity and are deleted after four weeks of inactivity if not reactivated.

References:
https://qdrant.tech/pricing/
https://qdrant.tech/documentation/cloud/create-cluster/

## Qdrant hybrid retrieval

Qdrant supports:

- multiple named vectors;
- sparse vectors;
- dense vectors;
- hybrid `prefetch`;
- server-side RRF.

Qdrant also documents native BM25 via sparse vectors.

This supports the recommended removal of application-local `rank-bm25`.

References:
https://qdrant.tech/documentation/search/text-search/hybrid-search/
https://qdrant.tech/documentation/search/hybrid-queries/
https://qdrant.tech/documentation/search/text-search/full-text-search/

## Qdrant Cloud Inference

Qdrant Cloud documents Cloud Inference for dense and sparse embedding generation and lists free models in the cluster console. It also documents `all-MiniLM-L6-v2` as a free dense model in its quickstart.

References:
https://qdrant.tech/documentation/cloud/inference/
https://qdrant.tech/documentation/cloud-quickstart/

## Supabase

Current Supabase pricing documents a Free plan including:

- 500 MB database size;
- 1 GB file storage;
- 50,000 monthly active users;
- projects pausing after one week of inactivity.

Supabase RLS documentation states that `auth.uid()` returns the authenticated user ID and can be used in row-level policies.

References:
https://supabase.com/pricing/
https://supabase.com/docs/guides/database/postgres/row-level-security
https://supabase.com/docs/guides/auth/jwt-fields

## Render

Render documents that its Free web services:

- spin down after 15 minutes without inbound traffic;
- take about a minute to spin back up;
- have ephemeral local files;
- should not use the local filesystem as durable storage.

Reference:
https://render.com/docs/free

Architecture implication:

The application must be stateless and must not rely on local uploaded PDFs or an in-memory corpus surviving restarts.

## Vercel

Vercel documents Python Functions and current Hobby/Fluid Compute usage. It also documents runtime limits for Python/Node functions.

Reference:
https://vercel.com/docs/functions
https://vercel.com/docs/functions/limitations

Architecture implication:

Vercel is excellent for the frontend and can host serverless functions, but migrating the Python FastAPI ingestion/query service merely to "go Edge" is not automatically a TTFT optimization.

## Gemini

Google's current Gemini model documentation lists:

- Gemini 3.1 Flash-Lite as a stable low-latency model;
- Gemini 3.5 Flash as a stable higher-capability model;
- Gemini 3.8 Flash as a stable high-capability Flash model.

The Gemini pricing documentation currently provides a Free tier for selected models, though quotas/rate limits are model/project dependent and can change.

References:
https://ai.google.dev/gemini-api/docs/models
https://ai.google.dev/gemini-api/docs/pricing
https://ai.google.dev/gemini-api/docs/rate-limits

## Groq

Groq's current rate limit documentation shows organization-level request/token limits. Exact availability and limits should be checked in the dashboard before treating Groq as a guaranteed free fallback.

Reference:
https://console.groq.com/docs/rate-limits

## Visual inspiration: Pachama

Pachama is a useful reference for environmental-tech visual language: strong nature imagery, restrained typography, outcome-oriented storytelling, and a direct path from scientific/environmental data to decisions.

Reference image/design discussion:
https://dribbble.com/shots/13598708-Pachama

Use the design principles, not their brand or content.

## Visual inspiration: GBIF

GBIF demonstrates a data-first biodiversity experience with searchable observation datasets, maps, filters, and a strong scientific identity.

Reference:
https://www.gbif.org/

Use GBIF for inspiration around evidence exploration and filtering, not as a visual clone.

## Visual inspiration: iNaturalist

iNaturalist's Explore experience demonstrates the usefulness of Map / Grid / List switching, filtering, species/taxon search, and evidence-focused information architecture.

References:
https://www.inaturalist.org/observations
https://help.inaturalist.org/en/support/solutions/articles/151000169670-how-to-search-inaturalist-observations

## Research rule

Web-researched provider facts are snapshots in time.

Re-check:

- pricing;
- model availability;
- API limits;
- free-tier quotas;

before final deployment.
