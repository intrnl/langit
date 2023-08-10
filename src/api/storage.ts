import { createEffect, createRoot } from 'solid-js';
import { type StoreNode, createMutable } from 'solid-js/store';

export const createReactiveLocalStorage = <T extends StoreNode>(name: string, initialValue?: T) => {
	try {
		const persisted = JSON.parse('' + localStorage.getItem(name));

		if (persisted != null) {
			initialValue = persisted;
		}
	} catch {}

	const mutable = createMutable<T>(initialValue || ({} as T));

	createRoot(() => {
		createEffect((changed: boolean) => {
			const json = JSON.stringify(mutable);

			if (changed) {
				localStorage.setItem(name, json);
			}

			return true;
		}, false);
	});

	return mutable;
};
