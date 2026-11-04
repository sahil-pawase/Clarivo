import React from 'react';
import { UploadZone } from '../shared/UploadZone';

export const Home: React.FC = () => {
	return (
		<div className="h-full flex flex-col gap-4">
			<div className="glass p-6">
				<h1 className="text-2xl font-semibold mb-2">Welcome to Clarivo</h1>
				<p className="text-gray-300">Drop your dataset to get started, or browse recent datasets.</p>
			</div>
			<UploadZone />
		</div>
	);
};


