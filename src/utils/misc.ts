let uid = 0;

export const createId = (prefix = '_') => {
	return prefix + uid++;
};

export const chunked = <T>(items: T[], size: number): T[][] => {
	const chunks: T[][] = [];

	for (let idx = 0, len = items.length; idx < len; idx += size) {
		const chunk = items.slice(idx, idx + size);
		chunks.push(chunk);
	}

	return chunks;
};

const EXCLUDED_TAGS = ['a', 'button', 'img', 'video'];

export const isElementClicked = (ev: Event, excludedTags: string[] = EXCLUDED_TAGS) => {
	const path = ev.composedPath() as HTMLElement[];

	if (
		(ev.type === 'keydown' && (ev as KeyboardEvent).key !== 'Enter') ||
		(ev.type === 'auxclick' && (ev as MouseEvent).button !== 1)
	) {
		return;
	}

	for (let idx = 0, len = path.length; idx < len; idx++) {
		const node = path[idx];
		const tag = node.localName;

		if (node == ev.currentTarget) {
			break;
		}

		if (excludedTags.includes(tag)) {
			return false;
		}
	}

	if (window.getSelection()?.toString()) {
		return false;
	}

	return true;
};

export const isElementAltClicked = (ev: MouseEvent | KeyboardEvent) => {
	return ev.type === 'auxclick' || ev.ctrlKey;
};
