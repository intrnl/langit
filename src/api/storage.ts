import { batch, createEffect, createRoot } from 'solid-js';

import { Signal, signal } from '~/utils/signals.ts';

export type StorageType = Record<string, any>;

export class ReactiveStorage<T extends StorageType> extends Signal<T> {
	#keys: Record<keyof T, Signal<any>> = Object.create(null);

	constructor(value?: T) {
		super(value || ({} as T));
	}

	#key(key: keyof T) {
		return (this.#keys[key] ||= signal(this.peek()[key]));
	}

	set<K extends keyof T>(key: K, value: T[K]) {
		const next = { ...this.peek(), [key]: value };

		batch(() => {
			this.#key(key).value = value;
			this.value = next;
		});
	}

	get<K extends keyof T>(key: K): T[K] {
		return this.#key(key).value;
	}

	merge<K extends keyof T>(
		key: K,
		value: T[K] extends Record<string, any> | undefined ? Partial<T[K]> : never,
	) {
		this.set(key, {
			...this.get(key),
			...value,
		});
	}

	clear() {
		this.value = null as any;
		this.#keys = Object.create(null);
	}
}

export class ReactiveLocalStorage<T extends StorageType> extends ReactiveStorage<T> {
	dispose: () => void;

	constructor(name: string, value?: T) {
		super(value);

		try {
			const persisted = JSON.parse('' + localStorage.getItem(name));

			if (persisted != null) {
				this.value = persisted;
			}
		} catch {}

		this.dispose = createRoot((dispose) => {
			createEffect(() => {
				const value = this.value;

				if (value != null) {
					localStorage.setItem(name, JSON.stringify(value));
				} else {
					localStorage.removeItem(name);
				}
			});

			return dispose;
		});
	}
}
