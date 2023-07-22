import { createEffect, createRoot } from 'solid-js';
import { type StoreNode, createMutable } from 'solid-js/store';

import { trackStore } from '@solid-primitives/deep';

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
			trackStore(mutable);

			if (changed) {
				localStorage.setItem(name, JSON.stringify(mutable));
			}

			return true;
		}, false);
	});

	return mutable;
};
