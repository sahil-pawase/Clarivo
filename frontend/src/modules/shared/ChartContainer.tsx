import React, { useRef, useEffect, useState, useMemo } from 'react';

// Custom hook for ResizeObserver
function useSize() {
	const ref = useRef<HTMLDivElement>(null);
	const [size, setSize] = useState({ width: 0, height: 0 });
	const last = useRef({ width: 0, height: 0 });
	const raf = useRef<number | null>(null);

	useEffect(() => {
		if (!ref.current) return;

		const ro = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;
			const { width, height } = entry.contentRect;
			// Avoid tight loops by only updating when values actually change
			if (Math.round(width) === Math.round(last.current.width) && Math.round(height) === Math.round(last.current.height)) {
				return;
			}
			if (raf.current) cancelAnimationFrame(raf.current);
			rawUpdate(width, height);
		});

		function rawUpdate(width: number, height: number) {
			raf.current = requestAnimationFrame(() => {
				last.current = { width, height };
				setSize({ width, height });
			});
		}

		ro.observe(ref.current);
		return () => {
			if (raf.current) cancelAnimationFrame(raf.current);
			ro.disconnect();
		};
	}, []);

	return [ref, size] as const;
}

interface ChartContainerProps {
	children: (size: { width: number; height: number }) => React.ReactNode;
	minHeight?: number;
	title?: string;
	subtitle?: string;
	className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = React.memo(({ 
	children, 
	minHeight = 360, 
	title, 
	subtitle,
	className = ''
}) => {
	const [ref, size] = useSize();

	const memoizedChildren = useMemo(() => {
		console.log('📏 ChartContainer Size Check:', {
			width: size.width,
			height: size.height,
			canRender: size.width > 0 && size.height > 0,
			minHeight,
			containerDimensions: size
		});
		
		// TEMPORARY FIX: Use fixed dimensions if container sizing fails
		const effectiveSize = {
			width: size.width > 0 ? size.width : 800,
			height: size.height > 0 ? size.height : 360
		};
		
		console.log('✅ ChartContainer: Using dimensions:', effectiveSize);
		return children(effectiveSize);
	}, [children, size.width, size.height, minHeight]);

	return (
		<div 
			ref={ref} 
			className={`bg-gray-800 border border-gray-700 rounded-lg ${className}`} 
			style={{ minHeight }}
		>
			{title && (
				<div className="text-lg font-semibold text-white mb-1 p-4 pb-0">
					{title}
				</div>
			)}
			{subtitle && (
				<div className="text-sm text-gray-300 mb-4 px-4">
					{subtitle}
				</div>
			)}
			<div className="flex-1 w-full h-full relative p-4">
				{memoizedChildren}
			</div>
		</div>
	);
});

ChartContainer.displayName = 'ChartContainer';
