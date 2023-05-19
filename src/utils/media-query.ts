import { createSignal, onCleanup } from 'solid-js';

interface MediaStore {
	c: number;
	m: MediaQueryList;
}

const map: Record<string, MediaStore> = {};

const getMediaMatcher = (query: string) => {
	let media = map[query];

	if (!media) {
		const matcher = window.matchMedia(query);
		media = { m: matcher, c: 0 };
	}

	return media;
};

export const useMediaQuery = (query: string): () => boolean => {
	const media = getMediaMatcher(query);
	const [state, setState] = createSignal(media.m.matches);

	const callback = () => setState(media.m.matches);

	callback();
	onCleanup(() => {
		media.m.removeEventListener('change', callback, false);

		if (--media.c < 1) {
			delete map[query];
		}
	});

	media.m.addEventListener('change', callback, false);
	media.c++;

	return state;
};
