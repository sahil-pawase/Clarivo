import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { App } from './modules/App';
import { Toaster } from 'react-hot-toast';

const root = ReactDOM.createRoot(
	document.getElementById('root') as HTMLElement
);

root.render(
	<React.StrictMode>
		<App />
		<Toaster
			position="bottom-right"
			toastOptions={{
				style: { background: 'rgba(20,25,38,0.95)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
				success: { iconTheme: { primary: '#00E5FF', secondary: '#111' } },
				error: { iconTheme: { primary: '#EF4444', secondary: '#111' } }
			}}
		/>
	</React.StrictMode>
);


