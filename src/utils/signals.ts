import { type Accessor, type Setter, type SignalOptions, createSignal, untrack } from 'solid-js';

// Solid's createSignal is pretty clunky to carry around as it returns an array
// that is expected to be destructured, this Signal class serves as a wrapper.

export class Signal<T> {
	private g: Accessor<T>;
	private s: Setter<T>;

	constructor(value: T, options?: SignalOptions<T>) {
		const impl = createSignal(value, options);
		this.g = impl[0];
		this.s = impl[1];
	}

	get value() {
		return this.g();
	}

	set value(next: T) {
		// @ts-expect-error
		this.s(typeof next === 'function' ? () => next : next);
	}

	peek() {
		return untrack(this.g);
	}
}

export interface ReadonlySignal<T> extends Signal<T> {
	readonly value: T;
}

export const signal = <T>(value: T, options?: SignalOptions<T>) => {
	return new Signal(value, options);
};
