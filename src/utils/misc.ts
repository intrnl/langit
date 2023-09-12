import { type Accessor, createRenderEffect } from 'solid-js';

export const EMPTY_ARRAY: unknown[] = [];

let uid = 0;

export const createId = (prefix = '_') => {
	return prefix + uid++;
};

export type VoidFunction = (...args: any[]) => void;

export const debounce = <F extends VoidFunction>(fn: F, delay: number) => {
	let timeout: any;

	return (...args: Parameters<F>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => fn(...args), delay);
	};
};

const EXCLUDED_TAGS = ['a', 'button', 'img', 'video', 'dialog'];
export const INTERACTION_TAGS = ['a', 'button'];

export const isElementClicked = (ev: Event, excludedTags: string[] = EXCLUDED_TAGS) => {
	const target = ev.currentTarget as HTMLElement;
	const path = ev.composedPath() as HTMLElement[];

	if (
		!path.includes(target) ||
		(ev.type === 'keydown' && (ev as KeyboardEvent).key !== 'Enter') ||
		(ev.type === 'auxclick' && (ev as MouseEvent).button !== 1)
	) {
		return false;
	}

	for (let idx = 0, len = path.length; idx < len; idx++) {
		const node = path[idx];
		const tag = node.localName;

		if (node == target) {
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

export const model = (getter: Accessor<string>, setter: (next: string) => void) => {
	return (node: HTMLInputElement | HTMLTextAreaElement) => {
		createRenderEffect(() => {
			node.value = getter();
		});

		node.addEventListener('input', () => {
			setter(node.value);
		});
	};
};

export const modelChecked = (getter: Accessor<boolean>, setter: (next: boolean) => void) => {
	return (node: HTMLInputElement) => {
		createRenderEffect(() => {
			node.checked = getter();
		});

		node.addEventListener('input', () => {
			setter(node.checked);
		});
	};
};

export const followAbortSignal = (signals: (AbortSignal | undefined)[]) => {
	const controller = new AbortController();
	const own = controller.signal;

	for (let idx = 0, len = signals.length; idx < len; idx++) {
		const signal = signals[idx];

		if (!signal) {
			continue;
		}

		if (signal.aborted) {
			return signal;
		}

		signal.addEventListener('abort', () => controller.abort(signal.reason), { signal: own });
	}

	return own;
};

export function assert(condition: any, message = 'Assertion failed'): asserts condition {
	if (import.meta.env.DEV && !condition) {
		throw new Error(message);
	}
}

const keys = Object.keys;

export const dequal = (a: any, b: any): boolean => {
	let ctor: any;
	let len: number;

	if (a === b) {
		return true;
	}

	if (a && b && (ctor = a.constructor) === b.constructor) {
		if (ctor === Array) {
			if ((len = a.length) === b.length) {
				while (len--) {
					if (!dequal(a[len], b[len])) {
						return false;
					}
				}
			}

			return len === -1;
		} else if (!ctor || ctor === Object) {
			len = 0;

			for (ctor in a) {
				len++;

				if (!(ctor in b) || !dequal(a[ctor], b[ctor])) {
					return false;
				}
			}

			return keys(b).length === len;
		}
	}

	return a !== a && b !== b;
};

export const EQUALS_DEQUAL = { equals: dequal } as const;
