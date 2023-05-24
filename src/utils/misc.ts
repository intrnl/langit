export const chunked = <T>(items: T[], size: number): T[][] => {
	const chunks: T[][] = [];

	for (let idx = 0, len = items.length; idx < len; idx += size) {
		const chunk = items.slice(idx, idx + size);
		chunks.push(chunk);
	}

	return chunks;
};

export type VoidFunction = (...args: any[]) => void;

export const debounce = <F extends VoidFunction>(fn: F, delay: number, leading = false) => {
	let timeout: any;

	return (...args: Parameters<F>) => {
		if (leading && !timeout) {
			fn(...args);
		}

		clearTimeout(timeout);
		timeout = setTimeout(() => fn(...args), delay);
	};
};
