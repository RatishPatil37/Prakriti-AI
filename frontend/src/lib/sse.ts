import { fetchEventSource } from '@microsoft/fetch-event-source';

export interface EnvironmentalContextData {
  region_or_coords?: string;
  climate_zone?: string;
  soil_organic_carbon_pct?: number;
  soil_ph?: number;
  annual_rainfall_mm?: number;
  temperature_c?: number;
  current_land_use?: string;
  crop_or_vegetation?: string;
  water_availability?: string;
  target_goals?: string[];
  soil_moisture_pct?: number;
  species_richness_count?: number;
  habitat_diversity_index?: number;
  pollution_level?: string;
  deforestation_impact?: string;
}

export interface ConversationTurnData {
  role: string;
  content: string;
}

export interface QueryStreamParams {
  question: string;
  environmental_context?: EnvironmentalContextData;
  conversation_context?: ConversationTurnData[];
  authToken?: string | null;
  onStatus?: (stage: string) => void;
  onEvidence?: (sources: any[], quality: any) => void;
  onToken?: (token: string) => void;
  onClarification?: (clarification: any) => void;
  onDone?: (metrics: any, quality: any, citationsVerified: boolean) => void;
  onError?: (err: any) => void;
  signal?: AbortSignal;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function streamEnvironmentalQuery({
  question,
  environmental_context,
  conversation_context,
  authToken,
  onStatus,
  onEvidence,
  onToken,
  onClarification,
  onDone,
  onError,
  signal
}: QueryStreamParams): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const endpoint = `${API_BASE_URL}/api/v1/query/stream`;

  try {
    await fetchEventSource(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        question,
        environmental_context: environmental_context || {},
        conversation_context: conversation_context || [],
      }),
      signal,
      async onopen(response) {
        if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
          return; // Connected
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before asking another question.');
        } else {
          throw new Error(`Server returned error: ${response.status} ${response.statusText}`);
        }
      },
      onmessage(event) {
        if (!event.data) return;
        try {
          const parsed = JSON.parse(event.data);

          if (event.event === 'status') {
            onStatus?.(parsed.stage);
          } else if (event.event === 'evidence') {
            onEvidence?.(parsed.sources || [], parsed.quality);
          } else if (event.event === 'token') {
            onToken?.(parsed.text || '');
          } else if (event.event === 'clarification') {
            onClarification?.(parsed);
          } else if (event.event === 'done') {
            onDone?.(parsed.metrics, parsed.evidence_quality, parsed.citations_verified);
          } else if (event.event === 'error') {
            onError?.(parsed);
          }
        } catch (e) {
          console.error('Error parsing SSE event data:', e, event.data);
        }
      },
      onerror(err) {
        console.error('SSE connection error:', err);
        throw err; // Stop retrying and let outer catch handle error dispatch
      }
    });
  } catch (err: any) {
    if (signal?.aborted) {
      console.log('User cancelled SSE stream');
      return;
    }
    onError?.(err);
  }
}
