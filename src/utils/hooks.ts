import {
	type Accessor,
	type Signal,
	createEffect,
	createMemo,
	createRenderEffect,
	createSignal,
	onCleanup,
} from 'solid-js';

export const useDebouncedValue = <T>(
	accessor: Accessor<T>,
	delay: number,
	equals?: false | ((prev: T, next: T) => boolean),
): Accessor<T> => {
	const initial = accessor();
	const [state, setState] = createSignal(initial, { equals });

	createEffect((prev: T) => {
		const next = accessor();

		if (prev !== next) {
			const timeout = setTimeout(() => setState(() => next), delay);
			onCleanup(() => clearTimeout(timeout));
		}

		return next;
	}, initial);

	return state;
};

export const createDerivedSignal = <T>(accessor: Accessor<T>): Signal<T> => {
	const [state, setState] = createSignal<T>();

	createRenderEffect(() => {
		setState(accessor);
	});

	return [state, setState] as any;
};

const EQUALS_FALSE = { equals: false } as const;

interface CLazyMemo {
	<T>(calc: (prev: T) => T, value: T): Accessor<T>;
	<T>(calc: (prev: T | undefined) => T, value?: undefined): Accessor<T>;
	<T>(calc: (prev: T | undefined) => T, value?: T): Accessor<T>;
}

export const createLazyMemo: CLazyMemo = <T>(calc: (prev: T | undefined) => T, value?: T): Accessor<T> => {
	let reading = false;
	let stale: boolean | undefined = true;

	const [track, trigger] = createSignal(void 0, EQUALS_FALSE);
	const memo = createMemo<T>((p) => (reading ? calc(p) : ((stale = !track()), p)), value as T, EQUALS_FALSE);

	return (): T => {
		reading = true;
		stale &&= trigger();

		const v = memo();
		reading = false;

		return v;
	};
};
