type IntersectionCallback = (entry: IntersectionObserverEntry) => void;

export class IntersectionObserverWrapper {
	public observer?: IntersectionObserver;

	private callbacks: Record<string, IntersectionCallback> = {};
	private backlog: Parameters<IntersectionObserverWrapper['observe']>[] = [];

	connect (options?: IntersectionObserverInit) {
		const backlog = this.backlog;

		this.observer = new IntersectionObserver((entries) => {
			for (let idx = 0, len = entries.length; idx < len; idx++) {
				const entry = entries[idx];
				const id = entry.target.getAttribute('data-id')!;

				this.callbacks[id]?.(entry);
			}
		}, options);

		if (backlog.length > 0) {
			for (let idx = 0, len = backlog.length; idx < len; idx++) {
				const params = backlog[idx];
				this.observe(...params);
			}

			backlog.length = 0;
		}
	}

	observe (id: string, node: Element, callback: IntersectionCallback) {
		if (this.observer) {
			this.callbacks[id] = callback;
			this.observer.observe(node);
		}
		else {
			this.backlog.push([id, node, callback]);
		}
	}

	unobserve (id: string, node: Element) {
		if (this.observer) {
			delete this.callbacks[id];
			this.observer.unobserve(node);
		}
	}
}
