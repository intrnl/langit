const callback: IntersectionObserverCallback = (entries, observer) => {
	for (let idx = 0, len = entries.length; idx < len; idx++) {
		const entry = entries[idx];

		const target = entry.target as any;
		const listener = target.$onintersect;

		if (listener) {
			listener(entry);
		} else {
			observer.unobserve(target);
		}
	}
};

export const scrollObserver = new IntersectionObserver(callback, { rootMargin: '106.25% 0px' });

declare module 'solid-js' {
	namespace JSX {
		interface ExplicitProperties {
			$onintersect: (entry: IntersectionObserverEntry) => void;
		}
	}
}
