import React from 'react';
import { useDatasets } from '../state/DatasetsContext';
import { chatWithAssistant, ChatMessage } from '../services/ai';
import toast from 'react-hot-toast';

// Enterprise Markdown & Analytical Renderer (No raw HTML injection, fully XSS-safe)
const inlineFormat = (text: string): React.ReactNode => {
	const parts: React.ReactNode[] = [];
	const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
	let lastIdx = 0;
	let match;
	let keyIdx = 0;

	while ((match = regex.exec(text)) !== null) {
		if (match.index > lastIdx) {
			parts.push(text.substring(lastIdx, match.index));
		}
		const token = match[0];
		if (token.startsWith('**') && token.endsWith('**')) {
			parts.push(<strong key={keyIdx++} className="font-semibold text-white">{token.slice(2, -2)}</strong>);
		} else if (token.startsWith('`') && token.endsWith('`')) {
			parts.push(<code key={keyIdx++} className="px-1.5 py-0.5 bg-blue-500/20 text-blue-200 border border-blue-500/30 rounded font-mono text-xs">{token.slice(1, -1)}</code>);
		} else if (token.startsWith('*') && token.endsWith('*')) {
			parts.push(<em key={keyIdx++} className="italic text-gray-300">{token.slice(1, -1)}</em>);
		}
		lastIdx = regex.lastIndex;
	}
	if (lastIdx < text.length) {
		parts.push(text.substring(lastIdx));
	}
	return parts.length > 0 ? parts : text;
};

const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
	if (!content) return null;
	const lines = content.split('\n');
	const elements: React.ReactNode[] = [];
	let inCodeBlock = false;
	let codeBuffer: string[] = [];

	lines.forEach((line, idx) => {
		const trimmed = line.trim();

		if (trimmed.startsWith('```')) {
			if (inCodeBlock) {
				elements.push(
					<pre key={`code-${idx}`} className="bg-black/60 border border-white/10 rounded-lg p-3 overflow-x-auto text-xs font-mono my-2 text-cyan-200">
						<code>{codeBuffer.join('\n')}</code>
					</pre>
				);
				codeBuffer = [];
				inCodeBlock = false;
			} else {
				inCodeBlock = true;
			}
			return;
		}

		if (inCodeBlock) {
			codeBuffer.push(line);
			return;
		}

		if (trimmed.startsWith('#### ')) {
			elements.push(<h5 key={idx} className="text-xs font-bold text-gray-300 uppercase tracking-wider mt-3 mb-1">{inlineFormat(trimmed.slice(5))}</h5>);
		} else if (trimmed.startsWith('### ')) {
			elements.push(<h4 key={idx} className="text-sm font-bold text-blue-300 mt-3 mb-1.5 flex items-center gap-1.5">{inlineFormat(trimmed.slice(4))}</h4>);
		} else if (trimmed.startsWith('## ')) {
			elements.push(<h3 key={idx} className="text-base font-bold text-white mt-4 mb-2">{inlineFormat(trimmed.slice(3))}</h3>);
		} else if (trimmed.startsWith('# ')) {
			elements.push(<h2 key={idx} className="text-lg font-extrabold text-blue-200 mt-4 mb-2">{inlineFormat(trimmed.slice(2))}</h2>);
		} else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
			elements.push(
				<div key={idx} className="flex items-start gap-2 my-1 ml-1 text-sm text-gray-200 leading-relaxed">
					<span className="text-blue-400 mt-1 text-xs">•</span>
					<div className="flex-1">{inlineFormat(trimmed.replace(/^[-*•]\s+/, ''))}</div>
				</div>
			);
		} else if (/^\d+\.\s+/.test(trimmed)) {
			const num = trimmed.match(/^\d+\./)?.[0] || '1.';
			const textAfter = trimmed.replace(/^\d+\.\s+/, '');
			elements.push(
				<div key={idx} className="flex items-start gap-2 my-1 ml-1 text-sm text-gray-200 leading-relaxed">
					<span className="text-blue-400 font-semibold text-xs mt-0.5">{num}</span>
					<div className="flex-1">{inlineFormat(textAfter)}</div>
				</div>
			);
		} else if (trimmed === '') {
			elements.push(<div key={idx} className="h-1.5" />);
		} else {
			elements.push(
				<p key={idx} className="text-sm text-gray-200 leading-relaxed my-1">
					{inlineFormat(line)}
				</p>
			);
		}
	});

	if (inCodeBlock && codeBuffer.length > 0) {
		elements.push(
			<pre key="code-end" className="bg-black/60 border border-white/10 rounded-lg p-3 overflow-x-auto text-xs font-mono my-2 text-cyan-200">
				<code>{codeBuffer.join('\n')}</code>
			</pre>
		);
	}

	return <div className="space-y-0.5">{elements}</div>;
};

export const Insights: React.FC = () => {
	const { previewFiltered, isLoading, datasets, selectedId, select } = useDatasets();
	const [messages, setMessages] = React.useState<ChatMessage[]>(() => {
		try {
			const saved = localStorage.getItem('clarivo_chat_history');
			return saved ? (JSON.parse(saved) as ChatMessage[]) : ([] as ChatMessage[]);
		} catch {
			return [] as ChatMessage[];
		}
	});
	const [input, setInput] = React.useState('What is this dataset about?');
	const [isSending, setIsSending] = React.useState(false);

	React.useEffect(() => {
		localStorage.setItem('clarivo_chat_history', JSON.stringify(messages.slice(-20)));
	}, [messages]);

	const sendMessage = React.useCallback(async () => {
		const trimmed = input.trim();
		if (!trimmed) return;
		const newMessages: ChatMessage[] = [...messages, { role: 'user' as const, content: trimmed }];
		setMessages(newMessages);
		setInput('');
		setIsSending(true);
		try {
			const reply = await chatWithAssistant(selectedId || null, newMessages, previewFiltered || undefined);
			setMessages((prev) => [...prev, reply]);
		} catch (e: any) {
			setMessages((prev) => [...prev, { role: 'system', content: e?.message || 'Failed to get response' }]);
		} finally {
			setIsSending(false);
		}
	}, [input, messages, previewFiltered, selectedId]);

	const sendPromptDirectly = React.useCallback(async (promptText: string) => {
		const trimmed = promptText.trim();
		if (!trimmed) return;
		const newMessages: ChatMessage[] = [...messages, { role: 'user' as const, content: trimmed }];
		setMessages(newMessages);
		setInput('');
		setIsSending(true);
		try {
			const reply = await chatWithAssistant(selectedId || null, newMessages, previewFiltered || undefined);
			setMessages((prev) => [...prev, reply]);
		} catch (e: any) {
			setMessages((prev) => [...prev, { role: 'system', content: e?.message || 'Failed to get response' }]);
		} finally {
			setIsSending(false);
		}
	}, [messages, previewFiltered, selectedId]);

	const clearChat = React.useCallback(() => {
		setMessages([]);
		localStorage.removeItem('clarivo_chat_history');
	}, []);

	return (
		<div className="h-full grid grid-rows-[auto_1fr_auto] gap-2">
			<div className="glass p-3 insights-header">
				{/* Header with logo, title, and Gemini status badge */}
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2.5">
						<img src="/logo.jpg" alt="Logo" className="w-7 h-7 rounded-lg object-contain shadow-md" />
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base font-bold text-white">Clarivo Insights AI</h2>
								<span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 text-blue-300 font-mono">
									Powered by Google Gemini
								</span>
							</div>
							<p className="text-xs text-gray-400">Intelligent conversational data reasoning & statistical inference</p>
						</div>
					</div>
					{localStorage.getItem('clarivo_profile_name') && (
						<div className="text-right">
							<div className="text-xs text-gray-400">Analyst</div>
							<div className="text-sm font-medium text-blue-300">{localStorage.getItem('clarivo_profile_name')}</div>
						</div>
					)}
				</div>
				
				{/* Dataset selector and API key */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<label className="text-xs font-medium text-gray-300">Context:</label>
						<select
							className="h-8 bg-gray-800 border border-gray-600 rounded-md px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all min-w-[220px] dataset-selector"
							value={selectedId || ''}
							onChange={(e) => select(e.target.value || null)}
						>
							<option value="" className="bg-gray-800 text-white">🌐 General AI Assistant (No dataset filter)</option>
							{datasets.map(d => (
								<option key={d.id} value={d.id} className="bg-gray-800 text-white hover:bg-gray-700">{d.name} ({d.rows} rows)</option>
							))}
						</select>
						{selectedId && (
							<div className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
								<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
								<span>Dataset Grounded</span>
							</div>
						)}
					</div>
					<div className="flex items-center gap-2">
						<ApiKeyControl />
					</div>
				</div>
			</div>
			<div className="glass p-0 overflow-auto">
				{messages.length === 0 ? (
					<div className="max-w-2xl mx-auto text-center py-8 px-4">
						<img src="/logo.jpg" alt="Logo" className="w-12 h-12 mx-auto mb-3 rounded-xl object-contain shadow-lg shadow-blue-500/20" />
						<h3 className="text-xl font-bold mb-1 text-white">Clarivo AI Decision Intelligence</h3>
						<p className="text-gray-300 text-sm mb-6 max-w-lg mx-auto">
							Direct cognitive dialogue with your uploaded data. Powered by Google Gemini and real-time statistical inference.
						</p>

						<div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Quick Analytical Prompts</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-lg mx-auto">
							{[
								{ title: '🎯 Executive Overview', desc: 'Summary of volume, schema and data structure', prompt: 'What is this dataset about?' },
								{ title: '📊 Correlation & Drivers', desc: 'Find pairwise Pearson correlations and patterns', prompt: 'Show the strongest correlations between variables' },
								{ title: '🔍 Data Hygiene Audit', desc: 'Audit nulls, missingness and completeness', prompt: 'Are there any missing or null values in this dataset?' },
								{ title: '⚠️ Anomaly & Outliers', desc: 'Detect statistical extremes using Tukey IQR', prompt: 'Detect anomalies and outliers across numerical columns' },
							].map((p, i) => (
								<button
									key={i}
									onClick={() => sendPromptDirectly(p.prompt)}
									className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all duration-200 group hover:border-cyan-500/30 hover:scale-[1.01]"
								>
									<div className="text-xs font-semibold text-blue-300 group-hover:text-blue-200">{p.title}</div>
									<div className="text-[11px] text-gray-400 mt-0.5">{p.desc}</div>
								</button>
							))}
						</div>
					</div>
				) : (
					<div className="max-w-3xl mx-auto space-y-3 py-3 px-3">
						{messages.map((m, idx) => (
							<div key={idx} className={`flex items-start gap-2.5 chat-message ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
								{m.role !== 'user' && <img src="/logo.jpg" alt="Clarivo" className="w-8 h-8 rounded-full object-contain bg-white/10 p-1 flex-shrink-0 mt-0.5" />}
								<div className={`message-bubble ${m.role === 'user' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/10 text-white border border-white/10'} px-4 py-3 rounded-2xl shadow-sm max-w-[85%] transition-colors duration-200`}>
									{m.role === 'user' ? <div className="text-sm leading-relaxed">{m.content}</div> : <MarkdownContent content={m.content} />}
								</div>
								{m.role === 'user' && (
									<div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold user-avatar flex-shrink-0 mt-0.5">
										{(() => {
											const avatar = localStorage.getItem('clarivo_profile_avatar');
											return avatar ? (
												<img 
													src={avatar} 
													alt="User" 
													className="w-full h-full rounded-full object-cover"
												/>
											) : (
												(() => {
													const name = localStorage.getItem('clarivo_profile_name');
													return name ? name.charAt(0).toUpperCase() : 'U';
												})()
											);
										})()}
									</div>
								)}
							</div>
						))}
						{isSending && (
							<div className="flex justify-start">
								<div className="flex items-center gap-2 bg-white/10 text-white px-3 py-2 rounded-2xl shadow-sm">
									<div className="flex space-x-1">
										<div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
										<div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
										<div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
									</div>
									<span className="text-sm">Clarivo is analyzing your data...</span>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
			<div className="glass px-3 py-2 grid grid-cols-[1fr_auto_auto] gap-2 sticky bottom-0">
					<input
						className="h-11 bg-white/10 border border-white/10 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-200 text-white placeholder-gray-400 chat-input"
						placeholder="Message Clarivo about your dataset…"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
					/>
					<button
						className="h-11 px-4 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-medium disabled:opacity-50 transition-colors duration-200"
						onClick={sendMessage}
						disabled={isSending || isLoading}
					>
						Send
					</button>
					<button
						className="h-11 px-3 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors duration-200"
						onClick={clearChat}
					>
						New Chat
					</button>
			</div>
		</div>
	);
};

// (Deprecated) Card UI kept for reference if needed in future
const InsightCard: React.FC<{ title: string; items?: string[]; raw?: string; loading?: boolean }> = ({ title, items, raw, loading }) => (
	<div className="glass p-4">
		<div className="flex items-center justify-between mb-2">
			<h4 className="font-semibold">{title}</h4>
			{loading && <span className="text-xs text-gray-400">Generating…</span>}
		</div>
		{items && items.length > 0 ? (
			<ul className="list-disc list-inside space-y-1 text-sm text-gray-100">
				{items.map((it, idx) => (
					<li key={idx}>{it}</li>
				))}
			</ul>
		) : raw ? (
			<pre className="text-gray-200 text-xs whitespace-pre-wrap">{raw}</pre>
		) : (
			<p className="text-gray-300 text-sm">Generated insight content will appear here. Pin to report or drill down for details.</p>
		)}
	</div>
);


const ApiKeyControl: React.FC = () => {
	const [value, setValue] = React.useState<string>(() => {
		try { return localStorage.getItem('clarivo_gemini_key') || ''; } catch { return ''; }
	});
	const [masked, setMasked] = React.useState(true);
	const save = () => { 
		try { 
			localStorage.setItem('clarivo_gemini_key', value.trim()); 
			toast.success('Gemini API Key saved!');
		} catch {} 
	};
	
	return (
		<div className="flex items-center gap-2">
			<div className="text-right">
				<div className="text-xs text-gray-400 mb-1">API Key</div>
				<div className="flex items-center gap-2">
					<input
						type={masked ? 'password' : 'text'}
						className="h-8 bg-white/10 border border-white/20 rounded-md px-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all w-36"
						placeholder="Gemini API Key"
						value={value}
						onChange={(e) => setValue(e.target.value)}
					/>
					<button 
						className="h-8 px-2 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs transition-colors" 
						onClick={() => setMasked((m) => !m)}
						title={masked ? 'Show API Key' : 'Hide API Key'}
					>
						{masked ? '👁️' : '🙈'}
					</button>
					<button 
						className="h-8 px-3 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors" 
						onClick={save}
					>
						Save
					</button>
				</div>
			</div>
		</div>
	);
};


