export type GeminiInsights = {
    keyTrends?: string[];
    summaryStatistics?: string[];
    correlations?: string[];
    rawText?: string;
};

type Preview = {
    columns: string[];
    data: Array<Record<string, any>>;
    total_rows: number;
    showing_rows: number;
};

function getGeminiApiKey(): string {
    try {
        if (typeof window !== 'undefined') {
            const k = localStorage.getItem('clarivo_gemini_key');
            if (k) return k;
        }
    } catch {}
    return process.env.REACT_APP_GEMINI_API_KEY || '';
}
const GEMINI_MODEL = 'gemini-3.6-flash';

function buildPrompt(userPrompt: string, preview?: Preview): string {
    const base = `You are a data analyst. Produce concise, actionable insights.
Return JSON with keys: keyTrends (array of strings), summaryStatistics (array of strings), correlations (array of strings).
Avoid markdown. 3-5 bullets per section.`;
    if (!preview) return `${base}\n\nUser question: ${userPrompt}`;

    const sampleRows = (preview.data || []).slice(0, 20);
    const datasetContext = JSON.stringify({
        columns: preview.columns,
        sample: sampleRows,
        total_rows: preview.total_rows,
        showing_rows: preview.showing_rows,
    });
    return `${base}\n\nDataset context (JSON): ${datasetContext}\n\nUser question: ${userPrompt}`;
}

export async function generateInsightsWithGemini(userPrompt: string, preview?: Preview): Promise<GeminiInsights> {
    const GEMINI_API_KEY = getGeminiApiKey();
    if (!GEMINI_API_KEY) {
        return { rawText: 'Gemini API key is not set. Define REACT_APP_GEMINI_API_KEY in your environment.' };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const contents = [{ role: 'user', parts: [{ text: buildPrompt(userPrompt, preview) }] }];

    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
    });

    if (!resp.ok) {
        const text = await resp.text();
        return { rawText: `Gemini request failed: ${resp.status} ${text}` };
    }
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Try to parse JSON payload; handle if model returns extra text
    try {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        const jsonSlice = firstBrace >= 0 && lastBrace > firstBrace ? text.slice(firstBrace, lastBrace + 1) : text;
        const parsed = JSON.parse(jsonSlice);
        return {
            keyTrends: parsed.keyTrends || parsed.key_trends,
            summaryStatistics: parsed.summaryStatistics || parsed.summary_statistics,
            correlations: parsed.correlations,
            rawText: text,
        };
    } catch {
        return { rawText: text };
    }
}

export type ChatMessage = { role: 'user' | 'model' | 'system'; content: string };

// Route chat through backend to avoid surfacing raw Gemini errors to the UI
import { chatWithDataset } from '../services/api';

export async function chatWithAssistant(datasetId: string | null, messages: ChatMessage[], preview?: Preview): Promise<ChatMessage> {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const query = lastUser?.content || '';
    const userKey = (localStorage.getItem('clarivo_gemini_key') || '').trim() || undefined;
    const targetId = datasetId || 'general';

    try {
        const resp = await chatWithDataset(targetId, query, userKey);
        return { role: 'model', content: resp.response || 'No response generated.' };
    } catch (e: any) {
        return { role: 'system', content: e?.response?.data?.detail || e?.message || 'Analytics engine unavailable. Please try again.' };
    }
}


