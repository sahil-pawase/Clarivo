import React from 'react';
import { DatasetItem, getPreview, listDatasets, PreviewResponse } from '../services/api';

type DatasetsState = {
	datasets: DatasetItem[];
	selectedId: string | null;
	selectedDatasetId: string | null; // Alias for selectedId
	currentDatasetId: string | null; // Alias for selectedId for compatibility
	preview: PreviewResponse | null;
	previewFiltered: PreviewResponse | null;
	isLoading: boolean;
	refresh: () => Promise<void>;
	select: (id: string | null) => Promise<void>;
	selectDataset: (id: string | null) => Promise<void>; // Alias for select
	setFilter: (column: string | null, value: string | null) => void;
};

const Ctx = React.createContext<DatasetsState | undefined>(undefined);

export const DatasetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [datasets, setDatasets] = React.useState<DatasetItem[]>([]);
	const [selectedId, setSelectedId] = React.useState<string | null>(null);
	const [preview, setPreview] = React.useState<PreviewResponse | null>(null);
	const [filter, setFilterState] = React.useState<{ column: string | null; value: string | null }>({ column: null, value: null });
	const [isLoading, setIsLoading] = React.useState(false);

	const refresh = React.useCallback(async () => {
		setIsLoading(true);
		try {
			const list = await listDatasets();
			setDatasets(list);
			if (list.length === 0) {
				setSelectedId(null);
				setPreview(null);
				return;
			}
			const stillExists = selectedId && list.some(d => d.id === selectedId);
			const targetId = stillExists ? selectedId! : list[0].id;
			if (!stillExists) {
				setSelectedId(targetId);
			}
			const pv = await getPreview(targetId, 500);
			setPreview(pv);
		} catch (err) {
			console.error('Failed to refresh datasets:', err);
			setDatasets([]);
			setPreview(null);
		} finally {
			setIsLoading(false);
		}
	}, [selectedId]);

	const select = React.useCallback(async (id: string | null) => {
		setSelectedId(id);
		if (!id) { setPreview(null); return; }
		setIsLoading(true);
		try {
			const pv = await getPreview(id, 500);
			setPreview(pv);
			setFilterState({ column: null, value: null });
		} finally {
			setIsLoading(false);
		}
	}, []);

	const setFilter = React.useCallback((column: string | null, value: string | null) => {
		setFilterState({ column, value });
	}, []);

	const previewFiltered = React.useMemo<PreviewResponse | null>(() => {
		if (!preview) return null;
		const { column, value } = filter;
		if (!column || value == null || value === '') return preview;
		const filteredData = (preview.data || []).filter((row) => String(row?.[column]) === String(value));
		return { ...preview, data: filteredData, showing_rows: filteredData.length };
	}, [preview, filter]);

	React.useEffect(() => {
		refresh();
	}, [refresh]);

	return (
		<Ctx.Provider value={{ 
			datasets, 
			selectedId, 
			selectedDatasetId: selectedId, // Alias for compatibility
			currentDatasetId: selectedId, // Alias for compatibility
			preview, 
			previewFiltered, 
			isLoading, 
			refresh, 
			select, 
			selectDataset: select, // Alias for compatibility
			setFilter 
		}}>
			{children}
		</Ctx.Provider>
	);
};

export function useDatasets(): DatasetsState {
	const ctx = React.useContext(Ctx);
	if (!ctx) throw new Error('useDatasets must be used within DatasetsProvider');
	return ctx;
}


