import { type Accessor, type Setter, createRenderEffect } from 'solid-js';

export const EMPTY_ARRAY: unknown[] = [];

let uid = 0;

export const createId = (prefix = '_') => {
	return prefix + uid++;
};

export type VoidFunction = (...args: any[]) => void;

export const debounce = <F extends VoidFunction>(fn: F, delay: number, leading = false) => {
	let timeout: any;

	return (...args: Parameters<F>) => {
		if (leading && !timeout) {
			fn(...args);
		}

		clearTimeout(timeout);
		timeout = setTimeout(() => fn(...args), delay);
	};
};

const EXCLUDED_TAGS = ['a', 'button', 'img', 'video', 'dialog'];
export const INTERACTION_TAGS = ['a', 'button'];

export const isElementClicked = (ev: Event, excludedTags: string[] = EXCLUDED_TAGS) => {
	const node = ev.currentTarget as HTMLElement;
	const path = ev.composedPath() as HTMLElement[];

	if (
		!path.includes(node) ||
		(ev.type === 'keydown' && (ev as KeyboardEvent).key !== 'Enter') ||
		(ev.type === 'auxclick' && (ev as MouseEvent).button !== 1)
	) {
		return false;
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

export const model = (getter: Accessor<string>, setter: Setter<string>) => {
	return (node: HTMLInputElement | HTMLTextAreaElement) => {
		createRenderEffect(() => {
			node.value = getter();
		});

		node.addEventListener('input', () => {
			setter(node.value);
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
