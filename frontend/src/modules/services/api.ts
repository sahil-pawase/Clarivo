import axios from 'axios';

// Resolve API base in this priority:
// 1) Electron preload: window.clarivo.apiBase (production desktop)
// 2) REACT_APP_API_BASE or REACT_APP_API_BASE_URL (dev overrides)
// 3) Fallback to http://127.0.0.1:8000
const runtimeBase = (
    typeof window !== 'undefined' && (window as any)?.clarivo?.apiBase
) || process.env.REACT_APP_API_BASE
 || process.env.REACT_APP_API_BASE_URL
 || 'http://127.0.0.1:8000';

export const API_BASE = `${runtimeBase.replace(/\/+$/, '')}/api/v1`;

// Helpful debug so we can see where the frontend is calling
try { console.info('[Clarivo] API_BASE ->', API_BASE); } catch {}

export type DatasetItem = { 
	id: string; 
	name: string; 
	rows: number;
	columns: number;
	size: number;
	uploaded_at: string;
	status: string;
};

export type PreviewResponse = { data: Array<Record<string, any>>; columns: string[]; total_rows: number; showing_rows: number };
export type ChatResponse = { response: string; timestamp: string; charts?: any[] };

// Chart types and interfaces
export async function listDatasets(): Promise<DatasetItem[]> {
	const resp = await axios.get(`${API_BASE}/datasets`);
	const data = Array.isArray(resp.data) ? resp.data : [];
	return data.map((d: any) => ({ 
		id: d.id, 
		name: d.name,
		rows: d.rows || 0,
		columns: d.columns || 0,
		size: d.size || 0,
		uploaded_at: d.uploaded_at || '',
		status: d.status || 'unknown'
	}));
}

export async function getPreview(datasetId: string, limit: number = 500): Promise<PreviewResponse> {
	const resp = await axios.get(`${API_BASE}/datasets/${datasetId}/preview`, { params: { limit } });
	return resp.data as PreviewResponse;
}

export async function uploadFile(file: File): Promise<DatasetItem> {
	const formData = new FormData();
	formData.append('file', file, file.name);
	const resp = await axios.post(`${API_BASE}/datasets/upload`, formData, {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
		timeout: 60000,
	});
	const d = resp.data || {};
	return {
		id: d.id,
		name: d.name,
		rows: d.rows || 0,
		columns: d.columns || 0,
		size: d.size || 0,
		uploaded_at: d.uploaded_at || '',
		status: d.status || 'unknown',
	};
}

export async function chatWithDataset(datasetId: string, query: string, apiKey?: string): Promise<ChatResponse> {
	const key = (apiKey || localStorage.getItem('clarivo_gemini_key') || '').trim() || undefined;
	const resp = await axios.post(`${API_BASE}/datasets/${datasetId}/chat`, {
		query,
		dataset_id: datasetId,
		api_key: key
	});
	return resp.data as ChatResponse;
}

export type ExecutiveReport = {
	dataset_name: string;
	generated_at: string;
	headline: string;
	executive_summary: string;
	kpis: Array<{ label: string; value: string; trend?: string; subtext?: string }>;
	strategic_insights: Array<{ title: string; description: string; impact: string }>;
	risk_matrix: Array<{ risk: string; severity: string; mitigation: string }>;
	recommended_initiatives: Array<{ initiative: string; timeline: string; expected_outcome: string }>;
};

export type ComplianceReport = {
	hygiene_score: number;
	grade: string;
	pii_detected: boolean;
	total_pii_columns: number;
	flags: Array<{
		column: string;
		pii_type: string;
		severity: string;
		detected_in_sample: number;
		sample_ratio: string;
		recommendation: string;
	}>;
	compliance_frameworks: {
		gdpr: { status: string; badge: string };
		hipaa: { status: string; badge: string };
		soc2_type2: { status: string; badge: string };
	};
	metrics: {
		total_rows: number;
		total_columns: number;
		null_percentage: number;
		duplicate_records: number;
	};
};

export type SystemHealth = {
	status: string;
	service: string;
	version: string;
	uptime_seconds: number;
	database: { status: string; type: string; ssl: boolean };
	ai_engine: { gemini_active: boolean; tier: string; heuristic_fallback: string };
	metrics: { total_datasets: number; memory_usage_mb: number; cpu_percent: number };
};

export async function getExecutiveReport(datasetId: string): Promise<ExecutiveReport> {
	const resp = await axios.get(`${API_BASE}/datasets/${datasetId}/executive-report`);
	return resp.data as ExecutiveReport;
}

export async function getDatasetCompliance(datasetId: string): Promise<ComplianceReport> {
	const resp = await axios.get(`${API_BASE}/datasets/${datasetId}/compliance`);
	return resp.data as ComplianceReport;
}

export async function generateSqlFromText(naturalQuery: string, targetTable?: string): Promise<{
	sql: string;
	explanation: string;
	confidence: number;
	suggested_chart_type?: string;
	x_column?: string;
	y_column?: string;
}> {
	const resp = await axios.post(`${API_BASE}/database/text-to-sql`, {
		natural_query: naturalQuery,
		target_table: targetTable
	});
	return resp.data;
}

export async function getSystemHealth(): Promise<SystemHealth> {
	const resp = await axios.get(`${API_BASE}/system/health`);
	return resp.data as SystemHealth;
}

export async function seedEnterpriseDemo(): Promise<any> {
	const resp = await axios.post(`${API_BASE}/datasets/seed-enterprise-demo`);
	return resp.data;
}

export async function getAuditLogs(): Promise<any[]> {
	const resp = await axios.get(`${API_BASE}/audit/logs?limit=50`);
	return resp.data?.logs || [];
}



