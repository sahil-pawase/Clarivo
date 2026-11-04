import React from 'react';

export const Settings: React.FC = () => {
	const [name, setName] = React.useState<string>(() => {
		try { return localStorage.getItem('clarivo_profile_name') || ''; } catch { return ''; }
	});
	const [avatar, setAvatar] = React.useState<string | null>(() => {
		try { return localStorage.getItem('clarivo_profile_avatar'); } catch { return null; }
	});
	const [email, setEmail] = React.useState<string>(() => {
		try { return localStorage.getItem('clarivo_profile_email') || ''; } catch { return ''; }
	});
	const [organization, setOrganization] = React.useState<string>(() => {
		try { return localStorage.getItem('clarivo_profile_org') || ''; } catch { return ''; }
	});
	const [showTips, setShowTips] = React.useState<boolean>(() => {
		try { return (localStorage.getItem('clarivo_show_tips') ?? 'true') === 'true'; } catch { return true; }
	});
	const [previewLimit, setPreviewLimit] = React.useState<number>(() => {
		try { return parseInt(localStorage.getItem('clarivo_preview_limit') || '500', 10); } catch { return 500; }
	});
	// Removed Gemini key state; backend uses local Ollama

	const fileInput = React.useRef<HTMLInputElement | null>(null);

	const save = () => {
		try {
			localStorage.setItem('clarivo_profile_name', name.trim());
			if (avatar) localStorage.setItem('clarivo_profile_avatar', avatar);
			localStorage.setItem('clarivo_profile_email', email.trim());
			localStorage.setItem('clarivo_profile_org', organization.trim());
			localStorage.setItem('clarivo_show_tips', String(showTips));
			localStorage.setItem('clarivo_preview_limit', String(previewLimit || 500));
		} catch {}
	};

	const clearLocalData = () => {
		try {
			Object.keys(localStorage)
				.filter(k => k.startsWith('clarivo_'))
				.forEach(k => localStorage.removeItem(k));
			setName('');
			setAvatar(null);
			setEmail('');
			setOrganization('');
			setShowTips(true);
			setPreviewLimit(500);
		} catch {}
	};

	const onPickFile = () => fileInput.current?.click();
	const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0];
		if (!f) return;
		const reader = new FileReader();
		reader.onload = () => {
			setAvatar(reader.result as string);
		};
		reader.readAsDataURL(f);
	};

	return (
		<div className="h-full overflow-auto p-6">
			<div className="max-w-2xl mx-auto space-y-6">
				<div className="glass p-6">
					<h2 className="text-2xl font-semibold mb-1">Settings</h2>
					<p className="text-gray-300">Basic profile settings</p>
				</div>
				<div className="glass p-6 space-y-4">
					<div className="flex items-center gap-4">
						<div className="w-16 h-16 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
							{avatar ? (
								<img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
							) : (
								<span className="text-gray-400 text-sm">No Avatar</span>
							)}
						</div>
						<div className="space-y-2">
							<div className="text-sm text-gray-300">Profile picture</div>
							<div className="flex items-center gap-2">
								<button className="h-9 px-3 rounded-md bg-white/10 text-white" onClick={onPickFile}>Upload</button>
								<input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onFile} />
								{avatar && (
									<button className="h-9 px-3 rounded-md bg-white/10 text-white" onClick={() => setAvatar(null)}>Remove</button>
								)}
							</div>
						</div>
					</div>
					<div>
						<label className="block text-sm text-gray-300 mb-1">Display name</label>
						<input
							className="w-full h-10 bg-white/10 border border-white/10 rounded-md px-3"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Your name"
						/>
					</div>
					<div className="grid md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm text-gray-300 mb-1">Email</label>
							<input
								className="w-full h-10 bg-white/10 border border-white/10 rounded-md px-3"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
							/>
						</div>
						<div>
							<label className="block text-sm text-gray-300 mb-1">Organization</label>
							<input
								className="w-full h-10 bg-white/10 border border-white/10 rounded-md px-3"
								value={organization}
								onChange={(e) => setOrganization(e.target.value)}
								placeholder="Company or school"
							/>
						</div>
					</div>
					<div className="grid md:grid-cols-2 gap-4">
						<div className="flex items-center gap-2">
							<input id="tips" type="checkbox" className="w-4 h-4" checked={showTips} onChange={(e) => setShowTips(e.target.checked)} />
							<label htmlFor="tips" className="text-sm text-gray-300">Show tips and guidance</label>
						</div>
						<div>
							<label className="block text-sm text-gray-300 mb-1">Preview row limit</label>
							<input
								type="number"
								min={50}
								max={5000}
								step={50}
								className="w-full h-10 bg-white/10 border border-white/10 rounded-md px-3"
								value={previewLimit}
								onChange={(e) => setPreviewLimit(parseInt(e.target.value || '500', 10))}
							/>
						</div>
					</div>
					{/* Gemini key UI removed; app runs offline via backend */}
					<div className="flex justify-end">
						<button className="h-10 px-4 rounded-md bg-white/10 text-white mr-2" onClick={clearLocalData}>Clear local data</button>
						<button className="h-10 px-4 rounded-md gradient-accent text-black font-medium" onClick={save}>Save</button>
					</div>
				</div>
			</div>
		</div>
	);
};


