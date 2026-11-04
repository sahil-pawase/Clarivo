import React from 'react';

export const Help: React.FC = () => {
	return (
		<div className="h-full overflow-auto p-6">
			<div className="max-w-4xl mx-auto space-y-6">
				<div className="glass p-6">
					<h2 className="text-2xl font-semibold mb-2">Help & Guide</h2>
					<p className="text-gray-300">Quick tips to get productive with Clarivo.</p>
				</div>

				<div className="grid md:grid-cols-2 gap-4">
					<div className="glass p-5 space-y-2">
						<h3 className="text-lg font-semibold">Getting started</h3>
						<ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
							<li>Upload your dataset in CSV, Excel (.xls, .xlsx), or JSON.</li>
							<li>Open View to preview rows and columns.</li>
							<li>Use Visualize to create charts from your columns.</li>
							<li>Ask questions in Insights chat for AI-driven analysis.</li>
						</ol>
					</div>
					<div className="glass p-5 space-y-2">
						<h3 className="text-lg font-semibold">Supported formats</h3>
						<ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
							<li>CSV: .csv</li>
							<li>Excel: .xls, .xlsx</li>
							<li>JSON: .json</li>
						</ul>
					</div>
					<div className="glass p-5 space-y-2">
						<h3 className="text-lg font-semibold">AI chat tips</h3>
						<ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
							<li>Be specific: "Top 5 categories by count"</li>
							<li>Reference columns: "Analyze career_popularity by stream_11_12"</li>
							<li>Filter in your question: "Only for difficulty_level = Medium"</li>
						</ul>
					</div>
					<div className="glass p-5 space-y-2">
						<h3 className="text-lg font-semibold">Troubleshooting</h3>
						<ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
							<li>If AI says the API key is missing, set it in Insights top bar.</li>
							<li>If a file is rejected, ensure the extension is .csv/.xls/.xlsx/.json.</li>
							<li>Large files may preview partially; use Visualize for summaries.</li>
						</ul>
					</div>
				</div>

				<div className="glass p-5">
					<h3 className="text-lg font-semibold mb-2">Keyboard shortcuts</h3>
					<ul className="text-sm text-gray-300 space-y-1">
						<li><span className="text-gray-400">Enter</span>: Send in chat</li>
						<li><span className="text-gray-400">Shift + Enter</span>: New line in chat</li>
					</ul>
				</div>
			</div>
		</div>
	);
};


