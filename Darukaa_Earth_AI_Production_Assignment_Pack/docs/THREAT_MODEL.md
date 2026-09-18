# THREAT_MODEL.md

## Assets

- private user documents;
- conversation history;
- source metadata;
- provider API keys;
- Qdrant API key;
- Supabase service-role key.

## Threats

### T1 Cross-tenant retrieval

Mitigation:

- verified JWT;
- Qdrant scope filter;
- tests.

### T2 Cache leak

Mitigation:

- user_id in key;
- context hash;
- knowledge version.

### T3 Prompt injection

Mitigation:

- documents treated as data;
- no tool execution;
- strict system prompt.

### T4 Malicious upload

Mitigation:

- size caps;
- MIME checks;
- parser failures isolated;
- storage path UUIDs.

### T5 Secret exposure

Mitigation:

- backend-only secrets;
- frontend environment variables limited to public Supabase config.

### T6 Stale vectors

Mitigation:

- document status;
- content hashes;
- deterministic IDs;
- reindex/reconcile command.

### T7 Provider abuse

Mitigation:

- per-user/IP throttling;
- bounded output;
- provider timeout;
- rate-limit aware fallback.

### T8 CORS misuse

Mitigation:

- explicit production origins;
- no wildcard origin with credentials.
