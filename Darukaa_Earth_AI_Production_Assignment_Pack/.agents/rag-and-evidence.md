# .agents/rag-and-evidence.md

## Retrieval policy

The public scientific KB is primary.

User-private content is an optional additional evidence source.

## Evidence hierarchy

Prefer:

1. peer-reviewed open-access research;
2. IPCC;
3. FAO;
4. IUCN;
5. GBIF and comparable scientific data infrastructure;
6. authoritative government/environment agencies.

## Evidence record

Each source should expose:

```text
[S1]
title
organization
year
page/section
url/doi
```

## Citation integrity

Every `[S#]` appearing in a response must resolve to a retrieved evidence item.

Do not allow free-form fake citation IDs.

## Multi-metric reasoning

For interventions, explain at least three relevant dimensions when evidence supports it.

Example:

```text
rainfall → soil moisture → microbial activity
land-use diversification → habitat heterogeneity → pollinator richness
```

The graph is a scaffold, not proof of causality.

## No evidence mode

When retrieval is weak:

```text
I don't have enough evidence in the indexed knowledge base to support a quantitative recommendation.
```

Then ask for missing context or provide only general educational information with explicit uncertainty.
