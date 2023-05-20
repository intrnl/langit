import { type Accessor, createEffect, createSignal, onCleanup, untrack } from 'solid-js';

export const useDebouncedValue = <T>(accessor: Accessor<T>, delay: number): Accessor<T> => {
	const [state, setState] = createSignal(accessor());

	createEffect(() => {
		const next = accessor();

		if (untrack(state) !== accessor) {
			const timeout = setTimeout(() => setState(() => next), delay);

			onCleanup(() => clearTimeout(timeout));
		}
	});

	return state;
};
