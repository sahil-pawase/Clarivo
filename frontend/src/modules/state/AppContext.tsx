import React from 'react';
import { useDatasets } from './DatasetsContext';

type AppState = {
	getCategoricalColumns: () => string[];
	getNumericColumns: () => string[];
	charts: any[];
};

const AppCtx = React.createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { preview } = useDatasets();
	const [charts, setCharts] = React.useState<any[]>([]);

	const getCategoricalColumns = React.useCallback(() => {
		const cols = preview?.columns || [];
		const sample = (preview?.data || []).slice(0, 10);
		return cols.filter((c) => sample.some((row: any) => typeof row?.[c] === 'string'));
	}, [preview]);

	const getNumericColumns = React.useCallback(() => {
		const cols = preview?.columns || [];
		const sample = (preview?.data || []).slice(0, 10);
		return cols.filter((c) => sample.some((row: any) => typeof row?.[c] === 'number'));
	}, [preview]);

	return (
		<AppCtx.Provider value={{ getCategoricalColumns, getNumericColumns, charts }}>
			{children}
		</AppCtx.Provider>
	);
};

export function useApp(): AppState {
	const ctx = React.useContext(AppCtx);
	if (!ctx) throw new Error('useApp must be used within AppProvider');
	return ctx;
}


