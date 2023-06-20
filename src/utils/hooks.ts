import {
	type Accessor,
	type Signal,
	createEffect,
	createRenderEffect,
	createSignal,
	onCleanup,
} from 'solid-js';

export const useDebouncedValue = <T>(accessor: Accessor<T>, delay: number): Accessor<T> => {
	const initial = accessor();
	const [state, setState] = createSignal(initial);

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
