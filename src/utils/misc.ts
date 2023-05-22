export const chunked = <T>(items: T[], size: number): T[][] => {
	const chunks: T[][] = [];

	for (let idx = 0, len = items.length; idx < len; idx += size) {
		const chunk = items.slice(idx, idx + size);
		chunks.push(chunk);
	}

	return chunks;
};
