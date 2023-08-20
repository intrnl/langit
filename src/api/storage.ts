import { createEffect, createRoot } from 'solid-js';
import { type StoreNode, createMutable, modifyMutable, reconcile } from 'solid-js/store';

const parse = (raw: string | null, initialValue: any) => {
	if (raw === null) {
		return initialValue;
	}

	try {
		const persisted = JSON.parse(raw);

		return persisted == null ? initialValue : persisted;
	} catch {
		return initialValue;
	}
};

export const createReactiveLocalStorage = <T extends StoreNode>(name: string, initialValue?: T) => {
	const mutable = createMutable<T>(parse(localStorage.getItem(name), initialValue ?? {}));

	let writable = true;

	createRoot(() => {
		createEffect((changed: boolean) => {
			const json = JSON.stringify(mutable);

			if (writable && changed) {
				localStorage.setItem(name, json);
			}

			return true;
		}, false);
	});

	window.addEventListener('storage', (ev) => {
		if (ev.key === name) {
			// Prevent our own effects from running, since this is already persisted.
			writable = false;

			modifyMutable(mutable, reconcile(parse(ev.newValue, initialValue ?? {}), { merge: true }));

			writable = true;
		}
	});

	return mutable;
};
